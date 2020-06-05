import React from 'react';
import { useRef } from 'react';
import { useState } from 'react';
import { flushData, trackFormSubmit } from '../instrumentation';

export default function Final({ onRestart }) {
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <>
        <h1>All Set</h1>
        <p>Thank you for your feedback.</p>
        <button onClick={onRestart}>Start Over</button>
      </>
    );
  }

  async function handleSubmit(evt) {
    evt.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);

    const formData = {};
    Array.from(formRef.current.elements).forEach((el) => {
      if (el.name) {
        formData[el.name] = el.value;
      }
    });

    trackFormSubmit({
      evt: 'feedback',
      category: 'Feedback',
      data: formData,
    });
    await flushData();

    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <>
      <h1>All Set</h1>
      <p>
        Thank you for testing the VoteAmerica E-Sign flow! We have a couple
        questions to help us improve this user experience.
      </p>
      <form onSubmit={handleSubmit} ref={formRef}>
        <label htmlFor="overall">
          Overall, how was the experience? Easy? Hard? Confusing?
        </label>
        <textarea name="overall" id="overall" />

        <label htmlFor="options">
          Of the three options for submitting the photo (take, upload, text),
          which one would you use on your computer? On your phone? If you were
          helping someone else?
        </label>
        <textarea name="options" id="options" />

        <label htmlFor="copyFeedback">
          What text/copy do you think would be most helpful in guiding people
          through the flow?
        </label>
        <textarea name="copyFeedback" id="copyFeedback" />

        <label htmlFor="bugs">
          Did you hit any bugs or get stuck at any point?
        </label>
        <textarea name="bugs" id="bugs" />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </>
  );
}
