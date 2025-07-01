import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';

const VideoPlayerPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef();
  const hlsRef = useRef(null);
  const [formErrors, setFormErrors] = useState([]);
  const [videoData, setVideoData] = useState(null);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forms, setForms] = useState([
    { timestamp: 0, selectedSegment: null, formId: '', segments: [] }
  ]);

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
      .catch(err => console.error(err));
  }, [videoId]);

  useEffect(() => {
    if (videoData?.url && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(`http://localhost:5000${videoData.url}`);
      hls.attachMedia(videoRef.current);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [videoData]);

  useEffect(() => {
    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        setDuration(videoRef.current.duration || 0);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [videoData]);

  const fetchClosestSegments = async (formIndex, timestampValue) => {
    try {
      const res = await fetch('http://localhost:5000/api/timestamp/closest-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, timestamp: timestampValue }),
      });
      const data = await res.json();
      if (data.success) {
        setForms(prevForms =>
          prevForms.map((form, idx) =>
            idx === formIndex ? { ...form, segments: data.segments } : form
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };


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
    setForms([...forms, { timestamp: 0, selectedSegment: null, formId: '', segments: [] }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    const errors = forms.map(f => ({
      formId: !f.formId.trim(),
      selectedSegment: f.selectedSegment === null,
    }));

    setFormErrors(errors);

    const hasErrors = errors.some(err => err.formId || err.selectedSegment);
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
        setForms([{ timestamp: 0, selectedSegment: null, formId: '', segments: [] }]);
        setFormErrors([]);
      }
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setSubmitting(false);
    }
  };



  if (!videoData) return <div style={{ padding: '2rem', color: '#fff' }}>Loading video...</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative', background: '#111', minHeight: '100vh' }}>
      <div style={{ width: '60%' }}>
        <video ref={videoRef} controls style={{ width: '100%' }} />
        <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', background: '#444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        {forms.map((form, formIndex) => (
          <div key={formIndex} style={{ border: '1px solid #444', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Select timestamp:
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={form.timestamp}
                  onChange={e => {
                    const value = Number(e.target.value);
                    updateForm(formIndex, 'timestamp', value);
                    fetchClosestSegments(formIndex, value);
                  }}
                  disabled={duration === 0}
                  style={{ flex: 1, accentColor: '#535bf2', height: '4px' }}
                />
                <span style={{ color: '#535bf2', fontWeight: 'bold', minWidth: 40 }}>{form.timestamp.toFixed(1)}s</span>
              </div>
            </label>

            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#6e8efb' }}>
              Closest Segments (Select One):
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {form.segments.map((seg, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                    <input
                      type="radio"
                      name={`segment-${formIndex}`}
                      value={idx}
                      checked={form.selectedSegment === idx}
                      onChange={() => updateForm(formIndex, 'selectedSegment', idx)}
                    />
                    <span style={{ fontWeight: 'bold' }}>
                      Segment {idx + 1}: {seg.start.toFixed(2)}s - {(seg.start + seg.duration).toFixed(2)}s
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {formErrors[formIndex]?.selectedSegment && (
              <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Please select a segment.
              </div>
            )}

            <input
              type="text"
              placeholder="Form ID"
              value={form.formId}
              onChange={e => updateForm(formIndex, 'formId', e.target.value)}
              style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
            />
            {formErrors[formIndex]?.formId && (
              <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                Please enter a form ID.
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemoveForm(formIndex)}
              style={{
                marginTop: '1rem',
                background: '#e35b5b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              🗑 Remove
            </button>
          </div>

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
    </div>
  );
};

export default VideoPlayerPage;
