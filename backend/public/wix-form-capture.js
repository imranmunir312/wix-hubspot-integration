(function () {
  var BACKEND_BASE_URL = 'https://wix-hubspot-integration-beta.vercel.app';
  var sentKeys = {};

  function getStoredAttribution() {
    try {
      var stored = localStorage.getItem('hubspot_attribution');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      var current = {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_term: params.get('utm_term') || '',
        utm_content: params.get('utm_content') || '',
        pageUrl: window.location.href,
        referrer: document.referrer || '',
      };

      var hasAny =
        current.utm_source ||
        current.utm_medium ||
        current.utm_campaign ||
        current.utm_term ||
        current.utm_content ||
        current.referrer;

      if (hasAny) {
        localStorage.setItem('hubspot_attribution', JSON.stringify(current));
      }
    } catch (e) {
      console.error('Failed to save attribution', e);
    }
  }

  function buildContextPayload(email, extras) {
    var attribution = getStoredAttribution();

    return {
      email: email || '',
      utm_source: attribution.utm_source || '',
      utm_medium: attribution.utm_medium || '',
      utm_campaign: attribution.utm_campaign || '',
      utm_term: attribution.utm_term || '',
      utm_content: attribution.utm_content || '',
      pageUrl: attribution.pageUrl || window.location.href,
      referrer: attribution.referrer || document.referrer || '',
      timestamp: new Date().toISOString(),
      source: 'wix_form_context_capture',
      rawPayload: extras || {},
    };
  }

  async function submitContextToBackend(payload) {
    if (!payload.email) {
      console.warn(
        'Skipping form context capture because email is missing',
        payload,
      );
      return;
    }

    var dedupeKey = [
      payload.email,
      payload.pageUrl,
      payload.utm_source,
      payload.utm_medium,
      payload.utm_campaign,
      payload.utm_term,
      payload.utm_content,
    ].join('|');

    if (sentKeys[dedupeKey]) {
      return;
    }

    sentKeys[dedupeKey] = true;

    try {
      var response = await fetch(BACKEND_BASE_URL + '/api/forms/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
      });

      if (!response.ok) {
        var text = await response.text();
        throw new Error(text || 'Failed to submit form context');
      }

      console.log('Form context pushed to backend successfully', payload);
    } catch (error) {
      console.error('Failed to push form context to backend', error);
    }
  }

  function findEmailInForm(form) {
    if (!form) return '';

    var selectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name*="email"]',
      'input[id*="email"]',
    ];

    for (var i = 0; i < selectors.length; i++) {
      var input = form.querySelector(selectors[i]);
      if (input && input.value && String(input.value).trim()) {
        return String(input.value).trim();
      }
    }

    return '';
  }

  function hookForm(form) {
    if (!form || form.dataset.hubspotContextBound === 'true') {
      return;
    }

    form.dataset.hubspotContextBound = 'true';

    form.addEventListener(
      'click',
      function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        var submitButton = target.closest(
          'button, input[type="submit"], [role="button"]',
        );

        if (!submitButton) {
          return;
        }

        var email = findEmailInForm(form);
        var payload = buildContextPayload(email, { formId: form.id || '' });

        setTimeout(function () {
          void submitContextToBackend(payload);
        }, 200);
      },
      true,
    );

    form.addEventListener(
      'submit',
      function () {
        var email = findEmailInForm(form);
        var payload = buildContextPayload(email, { formId: form.id || '' });

        setTimeout(function () {
          void submitContextToBackend(payload);
        }, 100);
      },
      true,
    );
  }

  function hookAllForms() {
    var forms = document.querySelectorAll('form');
    forms.forEach(hookForm);
  }

  function bootstrap() {
    console.log('wix-form-capture.js loaded');
    saveAttribution();
    hookAllForms();

    var observer = new MutationObserver(function () {
      hookAllForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
