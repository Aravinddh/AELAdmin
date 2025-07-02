import React from 'react';

const TimestampForm = ({
  form,
  formIndex,
  duration,
  onFormChange,
  onRemoveForm,
  formErrors,
  isEditMode = false
}) => {
  const fetchClosestSegments = async (timestampValue) => {
    try {
      const res = await fetch('http://localhost:5000/api/timestamp/closest-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: form.videoId, timestamp: timestampValue }),
      });
      const data = await res.json();
      if (data.success) {
        onFormChange(formIndex, 'segments', data.segments);
      }
    } catch {
      console.error('Error fetching closest segments');
    }
  };

  const updateForm = (key, value) => {
    onFormChange(formIndex, key, value);
  };

  return (
    <div style={{ border: '1px solid #444', padding: '1rem', borderRadius: '8px' }}>
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
              updateForm('timestamp', value);
              if (!isEditMode) {
                fetchClosestSegments(value);
              }
            }}
            disabled={duration === 0}
            style={{ flex: 1, accentColor: '#535bf2', height: '4px' }}
          />
          <span style={{ color: '#535bf2', fontWeight: 'bold', minWidth: 40 }}>
            {form.timestamp.toFixed(1)}s
          </span>
        </div>
      </label>

      {!isEditMode && (
        <>
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
                    onChange={() => updateForm('selectedSegment', idx)}
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
        </>
      )}

      <input
        type="text"
        placeholder="Form ID"
        value={form.formId}
        onChange={e => updateForm('formId', e.target.value)}
        style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
      />
      {formErrors[formIndex]?.formId && (
        <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Please enter a form ID.
        </div>
      )}
      
      {!isEditMode && (
        <button
          type="button"
          onClick={() => onRemoveForm(formIndex)}
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
      )}
    </div>
  );
};

export default TimestampForm; 