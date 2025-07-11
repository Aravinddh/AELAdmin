import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import TimestampForm from './TimestampForm';
import EditDeletePanel from './EditDeletePanel';

const MODES = { VIEW: 'view', EDIT: 'edit', DELETE: 'delete' };

const VideoPlayerPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState([]);
  const [videoData, setVideoData] = useState(null);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forms, setForms] = useState([
    { timestamp: 0, selectedSegment: null, formId: '', segments: [], videoId }
  ]);

  // Edit/Delete state
  const [mode, setMode] = useState(MODES.VIEW);
  const [fetchedForms, setFetchedForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ success: false, error: '' });

  useEffect(() => {
    fetch(`http://localhost:5000/api/videos/${videoId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVideoData(data.video);
        } else {
          console.error('Video not found');
        }
      })
      .catch(() => console.error('Error fetching video data'));
  }, [videoId]);

  // Form management functions
  const updateForm = (index, key, value) => {
    setForms(prevForms =>
      prevForms.map((form, idx) =>
        idx === index ? { ...form, [key]: value } : form
      )
    );
  };

  const handleRemoveForm = (index) => {
    setForms(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddForm = () => {
    setForms([...forms, { timestamp: 0, selectedSegment: null, formId: '', segments: [], videoId }]);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setSuccess(false);

  // 1. Fetch existing segments from DB
  let existingSegments = new Set();
  try {
    const res = await fetch(`http://localhost:5000/api/timestamp/${videoId}`);
    const data = await res.json();
    if (data.success) {
      data.forms.forEach(f => {
        if (f.selectedSegment?.segment) {
          existingSegments.add(f.selectedSegment.segment);
        }
      });
    }
  } catch {
    console.error("Error fetching existing segments");
  }

  const seenInForm = new Set();

  const errors = forms.map((f, idx) => {
    const seg = f.segments[f.selectedSegment]; 
    const segmentName = seg?.uri;
    const isDuplicateInDB = segmentName && existingSegments.has(segmentName);
    const isDuplicateInForm = segmentName && seenInForm.has(segmentName);

    if (segmentName) {
      seenInForm.add(segmentName); 
    }

    return {
      formId: !f.formId.trim(),
      selectedSegment: f.selectedSegment === null,
      segmentConflict: isDuplicateInDB || isDuplicateInForm,
    };
  });

  setFormErrors(errors);

  const hasErrors = errors.some(e => e.formId || e.selectedSegment || e.segmentConflict);
  if (hasErrors) {
    setSubmitting(false);
    return;
  }

  const payload = {
    videoId,
    selections: forms.map(f => ({
      timestamp: f.timestamp,
      formId: f.formId,
      selectedSegment: f.segments[f.selectedSegment]
    }))
  };

  try {
    const res = await fetch('http://localhost:5000/api/timestamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess(true);
      setForms([{ timestamp: 0, selectedSegment: null, formId: '', segments: [], videoId }]);
      setFormErrors([]);
    }
  } catch {
    console.error("Submit failed");
  } finally {
    setSubmitting(false);
  }
};



  // Edit/Delete functions
  const fetchForms = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/timestamp/${videoId}`);
      const data = await res.json();
      if (data.success) {
        setFetchedForms(data.forms);
      } else {
        setFetchedForms([]);
      }
    } catch {
      setFetchedForms([]);
    }
  };

  const handleEditClick = async () => {
    await fetchForms();
    setMode(MODES.EDIT);
    setSelectedForm(null);
    setEditForm(null);
  };

  const handleDeleteClick = async () => {
    await fetchForms();
    setMode(MODES.DELETE);
    setSelectedForm(null);
    setDeleteStatus({ success: false, error: '' });
  };

  const handleSelectEditForm = (form) => {
    setSelectedForm(form.formId);
    setEditForm({ ...form });
  };

  const handleEditFormChange = (changes) => {
    setEditForm(prev => ({ ...prev, ...changes }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    const seg = editForm.segments && editForm.selectedSegment != null
      ? editForm.segments[editForm.selectedSegment]
      : null;
    const payload = {
      videoId,
      timestamp: editForm.timestamp,
      selectedSegment: seg
        ? {
            segment: seg.uri,
            start: seg.start,
            end: seg.start + seg.duration,
            duration: seg.duration
          }
        : null,
    };
    try {
      const res = await fetch(`http://localhost:5000/api/timestamp/${editForm.formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMode(MODES.VIEW);
        setEditForm(null);
        setSelectedForm(null);
        setFetchedForms([]);
        setSuccess(true);
      }
    } catch {
      // handle error
    }
  };

  const handleSelectDeleteForm = (form) => {
    setSelectedForm(form.formId);
  };

  const handleDeleteForm = async () => {
    if (!selectedForm) return;
    const form = fetchedForms.find(f => f.formId === selectedForm);
    if (!form) return;
    try {
      const res = await fetch(`http://localhost:5000/api/timestamp/${form.formId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteStatus({ success: true, error: '' });
        setFetchedForms(fetchedForms.filter(f => f.formId !== form.formId));
        setSelectedForm(null);
      } else {
        setDeleteStatus({ success: false, error: data.message || 'Delete failed' });
      }
    } catch {
      setDeleteStatus({ success: false, error: 'Delete failed' });
    }
  };

  const handleCancel = () => {
    setMode(MODES.VIEW);
    setSelectedForm(null);
    setEditForm(null);
    setDeleteStatus({ success: false, error: '' });
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!videoData) return <div style={{ padding: '2rem', color: '#fff' }}>Loading video...</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative', background: '#111', minHeight: '100vh' }}>
      <div style={{ width: '60%' }}>
        <VideoPlayer videoData={videoData} onDurationChange={setDuration} />
      </div>

      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={handleBack} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
          <button onClick={handleEditClick} style={{ background: '#f2b705', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>✏️ Edit</button>
          <button onClick={handleDeleteClick} style={{ background: '#e35b5b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🗑 Delete</button>
        </div>

        {mode === MODES.VIEW ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {forms.map((form, formIndex) => (
              <TimestampForm
                key={formIndex}
                form={form}
                formIndex={formIndex}
                duration={duration}
                onFormChange={updateForm}
                onRemoveForm={handleRemoveForm}
                formErrors={formErrors}
                isEditMode={false}
              />
            ))}

            <button
              type="button"
              onClick={handleAddForm}
              style={{
                background: '#3ec46d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              + Add
            </button>

            <button
              type="submit"
              disabled={submitting || duration === 0}
              style={{
                background: 'linear-gradient(90deg, #535bf2 0%, #6e8efb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem 1.5rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: submitting || duration === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(83,91,242,0.15)',
                transition: 'background 0.2s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit All'}
            </button>
            {success && <span style={{ color: 'lightgreen', fontWeight: 'bold' }}>Form submitted successfully!</span>}
          </form>
        ) : (
          <EditDeletePanel
            mode={mode}
            fetchedForms={fetchedForms}
            selectedForm={selectedForm}
            editForm={editForm}
            deleteStatus={deleteStatus}
            duration={duration}
            videoId={videoId}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onSelectEditForm={handleSelectEditForm}
            onSelectDeleteForm={handleSelectDeleteForm}
            onEditFormChange={handleEditFormChange}
            onEditFormSubmit={handleEditFormSubmit}
            onDeleteForm={handleDeleteForm}
            onCancel={handleCancel}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default VideoPlayerPage;