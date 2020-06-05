import React from 'react';

export default function Hello({ onNext, onUpload, onPickMMS }) {
  return (
    <>
      <h1>VoteAmerica E-Sign Demo</h1>
      <p>
        Thank you for testing our E-Sign technology. This demo will walk you
        through the process we'll use with voters to collect their signature so
        they can sign and submit forms online.
      </p>
      <p>
        <strong>
          We will store your uploaded signature for up to 30 days.
        </strong>{' '}
        It will be stored, encrypted, in our AWS account and used to better tune
        our computer vision algorithms for extracting signatures from photos.
        It's most helpful if you use a picture of your real signature, but if
        you'd prefer, you can also use a fake signature.
      </p>
      <p>
        This app is just a demo; no paperwork or ballot applications will be
        submitted. Your signature will not be shared with anyone other than the{' '}
        <a
          href="https://www.voteamerica.com/team/"
          target="_blank"
          rel="noopener noreferrer"
        >
          VoteAmerica team
        </a>
        , and will not be used for any purposes other than improving our
        algorithms.
      </p>
      <p>
        At the end of the process, there will be short questionnaire to collect
        your feedback and help us refine our user experience.
      </p>
      <p>
        Thank you for helping us develop our registration, vote-by-mail, and
        voter turnout technology.
      </p>
      <div>
        <button onClick={onNext}>Begin &raquo;</button>
      </div>
    </>
  );
}
