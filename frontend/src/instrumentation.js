import { datadogRum } from '@datadog/browser-rum';
import * as Sentry from '@sentry/browser';
import { v4 as uuidv4 } from 'uuid';
import gtag, { install } from 'ga-gtag';

if (!localStorage.esignDemoUserID) {
  localStorage.esignDemoUserID = uuidv4();
}

if (process.env.REACT_APP_DD_CLIENT_TOKEN) {
  datadogRum.init({
    applicationId: process.env.REACT_APP_DD_APPLICATION_ID,
    clientToken: process.env.REACT_APP_DD_CLIENT_TOKEN,
    datacenter: 'us',
    sampleRate: 100,
  });

  datadogRum.addRumGlobalContext('usr', {
    id: localStorage.esignDemoUserID,
  });

  window.datadogRum = datadogRum;
}

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    beforeBreadcrumb: (crumb) => {
      if (
        crumb.category === 'fetch' &&
        crumb.data &&
        crumb.data.url &&
        crumb.data.url.startsWith('data:')
      ) {
        // Don't report fetch() to data URLs; those could contain signatures
        return null;
      }

      return crumb;
    },
  });

  Sentry.setUser({ id: localStorage.esignDemoUserID });
}

if (process.env.REACT_APP_GA_ID) {
  install(process.env.REACT_APP_GA_ID);
}

export function trackEvent({ evt, category, label, data }) {
  console.log(evt, { category, label, data });

  if (process.env.REACT_APP_GA_ID) {
    gtag('event', evt, {
      event_category: category,
      event_label: label,
    });
  }

  if (process.env.REACT_APP_DD_CLIENT_TOKEN) {
    datadogRum.addUserAction(evt, {
      event: {
        event_category: category,
        event_label: label,
      },
      data: data,
    });
  }

  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category,
      message: `${evt} ${label ? `- ${label}` : ''}`,
      level: Sentry.Severity.Info,
      data,
    });
  }
}

export function addContext(key, value) {
  console.log('Context', { [key]: value });

  if (process.env.REACT_APP_DD_CLIENT_TOKEN) {
    datadogRum.addRumGlobalContext(key, {
      value,
    });
  }

  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.setContext(key, { value });
  }
}

export function trackError(error) {
  console.error(error);

  if (process.env.REACT_APP_DD_CLIENT_TOKEN) {
    datadogRum.addUserAction('error', {
      msg: error.message,
    });
  }

  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error);
  }
}

export function trackFormSubmit(data) {
  console.log('Form submit', data);

  if (process.env.REACT_APP_GA_ID) {
    gtag('event', 'feedback', {
      event_category: 'Feedback',
    });
  }

  if (process.env.REACT_APP_DD_CLIENT_TOKEN) {
    datadogRum.addUserAction('formSubmit', {
      data,
    });
  }

  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setExtra('formData', data);
      Sentry.captureMessage('Feedback Submitted');
    });
  }
}

export function flushData() {
  const promises = [];

  if (process.env.REACT_APP_SENTRY_DSN) {
    promises.push(Sentry.flush())
  }

  return Promise.all(promises);
}
