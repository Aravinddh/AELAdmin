import React from 'react';
import TimestampForm from './TimestampForm';

const MODES = { VIEW: 'view', EDIT: 'edit', DELETE: 'delete' };

const EditDeletePanel = ({
  mode,
  fetchedForms,
  selectedForm,
  editForm,
  deleteStatus,
  duration,
  videoId,
  onEditClick,
  onDeleteClick,
  onSelectEditForm,
  onSelectDeleteForm,
  onEditFormChange,
  onEditFormSubmit,
  onDeleteForm,
  onCancel,
  onBack
}) => {
  const fetchClosestSegments = async (timestampValue) => {
    try {
      const res = await fetch('http://localhost:5000/api/timestamp/closest-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, timestamp: timestampValue }),
      });
      const data = await res.json();
      if (data.success) {
        onEditFormChange({
          segments: data.segments,
          selectedSegment: 0,
        });
      }
    } catch { /* ignore */ }
  };

  return (
    <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={onBack} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        <button onClick={onEditClick} style={{ background: '#f2b705', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>✏️ Edit</button>
        <button onClick={onDeleteClick} style={{ background: '#e35b5b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🗑 Delete</button>
      </div>

      {/* Edit Mode */}
      {mode === MODES.EDIT && (
        <div style={{ marginTop: '2rem', background: '#222', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ color: '#fff' }}>Edit a Form</h3>
          {fetchedForms.length === 0 ? (
            <div style={{ color: '#fff' }}>No forms found for this video.</div>
          ) : !selectedForm ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {fetchedForms.map((form) => (
                <li key={form.formId} style={{ marginBottom: 8 }}>
                  <button onClick={() => onSelectEditForm(form)} style={{ background: '#535bf2', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer' }}>
                    Edit Form ID: {form.formId} (Timestamp: {form.timestamp.toFixed(1)}s)
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <form onSubmit={onEditFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ color: '#fff' }}>
                Timestamp:
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={editForm.timestamp}
                    onChange={async e => {
                      const value = Number(e.target.value);
                      onEditFormChange({ timestamp: value });
                      fetchClosestSegments(value);
                    }}
                    disabled={duration === 0}
                    style={{ flex: 1, accentColor: '#535bf2', height: '4px' }}
                  />
                  <span style={{ color: '#535bf2', fontWeight: 'bold', minWidth: 40 }}>{editForm.timestamp?.toFixed(1)}s</span>
                </div>
              </label>
              
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#6e8efb' }}>
                Closest Segments (Select One):
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(editForm.segments || []).map((seg, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                      <input
                        type="radio"
                        name="edit-segment"
                        value={idx}
                        checked={editForm.selectedSegment === idx}
                        onChange={() => onEditFormChange({ selectedSegment: idx })}
                      />
                      <span style={{ fontWeight: 'bold' }}>
                        Segment {idx + 1}: {seg.start.toFixed(2)}s - {(seg.start + seg.duration).toFixed(2)}s
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              
              <label style={{ color: '#fff' }}>
                Segment:
                <div>{editForm.segments && editForm.selectedSegment != null && editForm.segments[editForm.selectedSegment] ? `Start: ${editForm.segments[editForm.selectedSegment].start.toFixed(2)}s, End: ${(editForm.segments[editForm.selectedSegment].start + editForm.segments[editForm.selectedSegment].duration).toFixed(2)}s` : 'None'}</div>
              </label>
              
              <button type="submit" style={{ background: '#3ec46d', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
              <button type="button" onClick={onCancel} style={{ background: '#e35b5b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* Delete Mode */}
      {mode === MODES.DELETE && (
        <div style={{ marginTop: '2rem', background: '#222', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ color: '#fff' }}>Delete a Form</h3>
          {fetchedForms.length === 0 ? (
            <div style={{ color: '#fff' }}>No forms found for this video.</div>
          ) : !selectedForm ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {fetchedForms.map((form) => (
                <li key={form.formId} style={{ marginBottom: 8 }}>
                  <button onClick={() => onSelectDeleteForm(form)} style={{ background: '#e35b5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer' }}>
                    Delete Form ID: {form.formId} (Timestamp: {form.timestamp.toFixed(1)}s)
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <div style={{ color: '#fff', marginBottom: 8 }}>Are you sure you want to delete Form ID: {selectedForm}?</div>
              <button onClick={onDeleteForm} style={{ background: '#e35b5b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer', marginRight: 8 }}>Confirm Delete</button>
              <button onClick={onCancel} style={{ background: '#535bf2', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              {deleteStatus.success && <div style={{ color: 'lightgreen', marginTop: 8 }}>Form deleted successfully!</div>}
              {deleteStatus.error && <div style={{ color: 'red', marginTop: 8 }}>{deleteStatus.error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditDeletePanel; 