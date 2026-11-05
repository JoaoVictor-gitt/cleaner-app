/**
 * Cleaner App 2.0 — booking flow (5 steps).
 *
 * Sections:
 *  1. Steps & state
 *  2. Pricing (demo estimate)
 *  3. Validation
 *  4. Rendering (progress, steps, calendar, summary, confirmation)
 *  5. Navigation & events
 *
 * Nothing in this module sends or stores personal data: the booking state
 * lives only in memory and is discarded when the page is closed.
 */
(function (global) {
  'use strict';

  const CleanerApp = global.CleanerApp || (global.CleanerApp = {});
  const { data, ui } = CleanerApp;

  /* =========================================================
   * 1. Steps & state
   * ======================================================= */

  const STEPS = [
    { label: 'Service', title: 'Which service do you need?', description: 'Choose the type of cleaning you would like to book.' },
    { label: 'Property', title: 'Tell us about your property', description: 'This helps us prepare the right team and estimate the time needed.' },
    { label: 'Date & Time', title: 'When would you like us to come?', description: 'Pick a preferred date and time. You can change it at any point before submitting.' },
    { label: 'Your Details', title: 'Your contact details', description: 'We will use these details to confirm your booking request.' },
    { label: 'Review', title: 'Review your booking request', description: 'Please check everything below before submitting.' }
  ];
  const TOTAL_STEPS = STEPS.length;

  function createInitialState() {
    return {
      serviceId: null,
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      size: '',
      extras: [],
      date: null, // 'YYYY-MM-DD'
      time: null, // 'HH:MM'
      customer: {
        fullName: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        eircode: '',
        instructions: ''
      }
    };
  }

  let state = createInitialState();
  let currentStep = 1;
  let submittedReference = null;
  let errorsVisible = false;
  const calendarView = { year: 0, month: 0, focusedDate: null };

  /** Applies a service and adapts property data to that service's form. */
  function selectService(serviceId) {
    const service = data.getService(serviceId);
    if (!service) return;
    const { form } = service;

    state.serviceId = serviceId;

    if (!form.propertyTypes.includes(state.propertyType)) {
      state.propertyType = form.propertyTypes.length === 1 ? form.propertyTypes[0] : null;
    }

    ['bedrooms', 'bathrooms'].forEach((name) => {
      const field = form.fields[name];
      if (!field) {
        state[name] = null;
        return;
      }
      const value = state[name];
      state[name] = value === null || value < field.min || value > field.max ? field.default : value;
    });

    if (!form.fields.size) state.size = '';
    state.extras = state.extras.filter((id) => form.extras.includes(id));
  }

  function toggleExtra(extraId, checked) {
    const extras = new Set(state.extras);
    if (checked) extras.add(extraId);
    else extras.delete(extraId);
    state.extras = [...extras];
  }

  function getCurrentService() {
    return data.getService(state.serviceId);
  }

  /* =========================================================
   * 2. Pricing (demo estimate)
   * ======================================================= */

  /** "Bathrooms" -> "2 bathrooms", "Restrooms" -> "1 restroom" */
  function countLabel(field, count) {
    const singular = field.label.toLowerCase().replace(/s$/, '');
    return ui.pluralise(count, singular);
  }

  /**
   * Pricing strategies, selected by PRICING_CONFIG.services[id].model.
   * Each returns { total, hours, lines } before extras.
   * To add a new billing model later, add a new key here.
   */
  const PRICING_MODELS = {
    rooms(rule, s, service) {
      const lines = [{ label: `${service.name} (base)`, amount: rule.basePrice }];
      let total = rule.basePrice;
      let hours = rule.baseHours;
      const { bedrooms, bathrooms } = service.form.fields;

      if (bedrooms && s.bedrooms > 0) {
        const amount = s.bedrooms * rule.perBedroom;
        lines.push({ label: countLabel(bedrooms, s.bedrooms), amount });
        total += amount;
        hours += s.bedrooms * rule.perBedroomHours;
      }
      if (bathrooms && s.bathrooms > 0) {
        const amount = s.bathrooms * rule.perBathroom;
        lines.push({ label: countLabel(bathrooms, s.bathrooms), amount });
        total += amount;
        hours += s.bathrooms * rule.perBathroomHours;
      }
      return { total, hours, lines };
    },

    area(rule, s, service) {
      const lines = [{ label: `${service.name} (base, up to ${rule.includedSqm} m²)`, amount: rule.basePrice }];
      let total = rule.basePrice;
      let hours = rule.baseHours;
      const size = Number(s.size) || 0;
      const extraSqm = Math.max(0, Math.round(size - rule.includedSqm));
      const { bathrooms } = service.form.fields;

      if (extraSqm > 0) {
        const amount = extraSqm * rule.perSqm;
        lines.push({ label: `Additional area (${extraSqm} m²)`, amount });
        total += amount;
        hours += extraSqm / rule.sqmPerHour;
      }
      if (bathrooms && s.bathrooms > 0) {
        const amount = s.bathrooms * rule.perBathroom;
        lines.push({ label: countLabel(bathrooms, s.bathrooms), amount });
        total += amount;
        hours += s.bathrooms * rule.perBathroomHours;
      }
      return { total, hours, lines };
    }
  };

  /** Returns a DEMO estimate { total, hours, lines, isDemo } or null. */
  function estimatePrice(s = state) {
    const service = data.getService(s.serviceId);
    const rule = data.PRICING_CONFIG.services[s.serviceId];
    const model = rule && PRICING_MODELS[rule.model];
    if (!service || !model) return null;

    let { total, hours, lines } = model(rule, s, service);

    s.extras.forEach((id) => {
      const extraRule = data.PRICING_CONFIG.extras[id];
      if (!extraRule) return;
      lines.push({ label: data.EXTRAS[id].name, amount: extraRule.price });
      total += extraRule.price;
      hours += extraRule.hours;
    });

    return {
      total: Math.round(total * 100) / 100,
      hours,
      lines,
      isDemo: data.PRICING_CONFIG.isDemo
    };
  }

  /* =========================================================
   * 3. Validation
   * ======================================================= */

  // Irish Eircode: routing key (letter + 2 digits, or D6W) + optional space + 4-char unique identifier.
  const EIRCODE_PATTERN = /^(?:[AC-FHKNPRTV-Y]\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Irish numbers after removing spaces, dashes, dots and brackets: 0XXXXXXXX(X) or +353 / 00353 prefix.
  const PHONE_PATTERN = /^(?:(?:\+|00)3530?|0)\d{7,9}$/;

  function normaliseEircode(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
  }

  function isValidEircode(value) {
    return EIRCODE_PATTERN.test(normaliseEircode(value));
  }

  /** "d02x285" -> "D02 X285" (returns the input normalised if not a full Eircode). */
  function formatEircode(value) {
    const normalised = normaliseEircode(value);
    const compact = normalised.replace(/ /g, '');
    return isValidEircode(normalised) ? `${compact.slice(0, 3)} ${compact.slice(3)}` : normalised;
  }

  function isValidEmail(value) {
    return EMAIL_PATTERN.test(String(value || '').trim());
  }

  function isValidIrishPhone(value) {
    return PHONE_PATTERN.test(String(value || '').replace(/[\s\-().]/g, ''));
  }

  /** Customer form definition (step 4). */
  const CUSTOMER_FIELDS = [
    {
      name: 'fullName', label: 'Full Name', type: 'text', autocomplete: 'name', required: true, maxLength: 80, width: 'full',
      validate: (v) => (v.trim().length >= 2 && /\p{L}/u.test(v) ? '' : 'Please enter your full name.')
    },
    {
      name: 'email', label: 'Email Address', type: 'email', autocomplete: 'email', required: true, maxLength: 120, width: 'half',
      validate: (v) => (isValidEmail(v) ? '' : 'Please enter a valid email address, e.g. name@example.com.')
    },
    {
      name: 'phone', label: 'Phone Number', type: 'tel', autocomplete: 'tel', required: true, maxLength: 20, width: 'half',
      hint: 'e.g. 087 123 4567 or +353 87 123 4567',
      validate: (v) => (isValidIrishPhone(v) ? '' : 'Please enter a valid Irish phone number, e.g. 087 123 4567.')
    },
    {
      name: 'address1', label: 'Address Line 1', type: 'text', autocomplete: 'address-line1', required: true, maxLength: 100, width: 'full',
      validate: (v) => (v.trim().length >= 3 ? '' : 'Please enter your street address.')
    },
    { name: 'address2', label: 'Address Line 2', type: 'text', autocomplete: 'address-line2', required: false, maxLength: 100, width: 'full' },
    {
      name: 'city', label: 'City / Town', type: 'text', autocomplete: 'address-level2', required: true, maxLength: 60, width: 'half',
      validate: (v) => (v.trim().length >= 2 ? '' : 'Please enter your city or town.')
    },
    {
      name: 'eircode', label: 'Eircode', type: 'text', autocomplete: 'postal-code', required: true, maxLength: 8, width: 'half',
      hint: 'e.g. D02 X285', transform: 'uppercase',
      validate: (v) => (isValidEircode(v) ? '' : 'Please enter a valid Eircode, e.g. D02 X285 or A65F4E2.')
    },
    {
      name: 'instructions', label: 'Additional Instructions', type: 'textarea', required: false, maxLength: 500, width: 'full',
      hint: 'Access details, parking, pets, areas to focus on…'
    }
  ];

  function validateCustomerField(field, value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return field.required ? `Please enter your ${field.label.toLowerCase()}.` : '';
    if (field.maxLength && trimmed.length > field.maxLength) return `Please use ${field.maxLength} characters or fewer.`;
    return field.validate ? field.validate(trimmed) : '';
  }

  /** Date range allowed by CALENDAR_CONFIG. */
  function getDateBounds() {
    const { minDaysAhead, maxMonthsAhead } = data.CALENDAR_CONFIG;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() + minDaysAhead);
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + maxMonthsAhead, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    const max = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(today.getDate(), lastDay));
    return { today, min, max };
  }

  function isDateSelectable(iso) {
    if (!iso) return false;
    const { min, max } = getDateBounds();
    const date = ui.parseISODate(iso);
    return date >= min && date <= max;
  }

  /** Returns a list of { field?, message } for the given step. */
  function getStepErrors(step, s = state) {
    const errors = [];
    const service = data.getService(s.serviceId);

    switch (step) {
      case 1:
        if (!service) errors.push({ message: 'Please choose a service to continue.' });
        break;

      case 2: {
        if (!service) {
          errors.push({ message: 'Please choose a service first.' });
          break;
        }
        if (!s.propertyType) errors.push({ field: 'propertyType', message: 'Please select a property type.' });
        const sizeField = service.form.fields.size;
        const size = String(s.size ?? '').trim();
        if (sizeField) {
          if (!size && sizeField.required) {
            errors.push({ field: 'size', message: `Please enter the approximate size in ${sizeField.unit}.` });
          } else if (size) {
            const n = Number(size);
            if (!Number.isFinite(n) || n < sizeField.min || n > sizeField.max) {
              errors.push({ field: 'size', message: `Please enter a size between ${sizeField.min} and ${sizeField.max} ${sizeField.unit}.` });
            }
          }
        }
        break;
      }

      case 3:
        if (!s.date) errors.push({ message: 'Please choose a date for your cleaning.' });
        else if (!isDateSelectable(s.date)) errors.push({ message: 'Please choose a date within the available range.' });
        if (!s.time) errors.push({ message: 'Please choose a preferred time.' });
        break;

      case 4:
        CUSTOMER_FIELDS.forEach((field) => {
          const message = validateCustomerField(field, s.customer[field.name]);
          if (message) errors.push({ field: field.name, message });
        });
        break;

      default:
        break;
    }
    return errors;
  }

  function isStepValid(step) {
    return getStepErrors(step).length === 0;
  }

  function canGoToStep(step) {
    for (let i = 1; i < step; i += 1) {
      if (!isStepValid(i)) return false;
    }
    return true;
  }

  /* =========================================================
   * 4. Rendering
   * ======================================================= */

  const els = {};
  const { icon, escapeHtml: esc, formatCurrency } = ui;

  function renderProgress() {
    els.progress.innerHTML = STEPS.map((step, index) => {
      const n = index + 1;
      const isCurrent = n === currentStep;
      const isComplete = n < currentStep;
      const isClickable = !isCurrent && canGoToStep(n);
      const classes = ['progress__item', isCurrent && 'is-current', isComplete && 'is-complete'].filter(Boolean).join(' ');
      return `
        <li class="${classes}">
          <button type="button" class="progress__step" data-goto="${n}" id="progress-step-${n}"
            ${isCurrent ? 'aria-current="step"' : ''} ${isClickable ? '' : 'disabled'}>
            <span class="progress__dot">${isComplete ? icon('check') : n}</span>
            <span class="progress__label">${step.label}</span>
            ${isComplete ? '<span class="visually-hidden">(completed)</span>' : ''}
          </button>
        </li>`;
    }).join('');
    els.progressFill.style.width = `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`;
  }

  function renderStepHeader() {
    const step = STEPS[currentStep - 1];
    return `
      <div class="step-header">
        <p class="step-header__count">Step ${currentStep} of ${TOTAL_STEPS}</p>
        <h2 class="step-header__title" id="step-title" tabindex="-1">${step.title}</h2>
        <p class="step-header__desc">${step.description}</p>
      </div>`;
  }

  /* ---------- Step 1: Service ---------- */
  function renderServiceStep() {
    const cards = data.SERVICES.map((service) => {
      const checked = state.serviceId === service.id;
      return `
        <label class="choice-card choice-card--service ${checked ? 'is-selected' : ''}" for="service-${service.id}">
          <input class="choice-card__input" type="radio" name="service" id="service-${service.id}" value="${service.id}" ${checked ? 'checked' : ''}>
          <span class="choice-card__icon">${icon(service.icon)}</span>
          <span class="choice-card__body">
            <span class="choice-card__title">${esc(service.name)}</span>
            <span class="choice-card__text">${esc(service.description)}</span>
          </span>
          <span class="choice-card__check">${icon('check')}</span>
        </label>`;
    }).join('');
    return `
      <fieldset class="fieldset">
        <legend class="visually-hidden">Service type</legend>
        <div class="choice-grid choice-grid--2">${cards}</div>
      </fieldset>`;
  }

  /* ---------- Step 2: Property ---------- */
  function renderStepper(name, field) {
    const value = state[name];
    const atMin = value <= field.min;
    const atMax = value >= field.max;
    return `
      <div class="field">
        <span class="field__label" id="label-${name}">${field.label}</span>
        <div class="stepper" role="group" aria-labelledby="label-${name}">
          <button type="button" class="stepper__btn" id="${name}-decrease" data-stepper="${name}" data-delta="-1"
            aria-label="Decrease ${field.label.toLowerCase()}" ${atMin ? 'aria-disabled="true"' : ''}>${icon('minus')}</button>
          <output class="stepper__value" id="${name}-value" aria-live="polite">${value}</output>
          <button type="button" class="stepper__btn" id="${name}-increase" data-stepper="${name}" data-delta="1"
            aria-label="Increase ${field.label.toLowerCase()}" ${atMax ? 'aria-disabled="true"' : ''}>${icon('plus')}</button>
        </div>
      </div>`;
  }

  function renderPropertyStep() {
    const service = getCurrentService();
    if (!service) return '<p>Please choose a service first.</p>';
    const { form } = service;

    const propertyCards = form.propertyTypes.map((typeId) => {
      const type = data.PROPERTY_TYPES[typeId];
      const checked = state.propertyType === typeId;
      return `
        <label class="choice-card choice-card--compact ${checked ? 'is-selected' : ''}" for="ptype-${typeId}">
          <input class="choice-card__input" type="radio" name="propertyType" id="ptype-${typeId}" value="${typeId}" ${checked ? 'checked' : ''}>
          <span class="choice-card__icon">${icon(type.icon)}</span>
          <span class="choice-card__title">${type.name}</span>
          <span class="choice-card__check">${icon('check')}</span>
        </label>`;
    }).join('');

    const steppers = ['bedrooms', 'bathrooms']
      .filter((name) => form.fields[name])
      .map((name) => renderStepper(name, form.fields[name]))
      .join('');

    const sizeField = form.fields.size;
    const sizeHtml = sizeField ? `
      <div class="field field--size">
        <label class="field__label" for="field-size">
          ${sizeField.label} ${sizeField.required ? '' : '<span class="field__optional">(optional)</span>'}
        </label>
        <div class="input-suffix">
          <input class="field__input" type="number" inputmode="numeric" id="field-size" name="size"
            min="${sizeField.min}" max="${sizeField.max}" step="1" value="${esc(state.size)}"
            placeholder="e.g. ${sizeField.required ? 120 : 75}" aria-describedby="field-size-error"
            ${sizeField.required ? 'required aria-required="true"' : ''}>
          <span class="input-suffix__unit" aria-hidden="true">${sizeField.unit}</span>
        </div>
        <p class="field__error" id="field-size-error"></p>
      </div>` : '';

    const extraCards = form.extras.map((extraId) => {
      const extra = data.EXTRAS[extraId];
      const price = data.PRICING_CONFIG.extras[extraId];
      const checked = state.extras.includes(extraId);
      return `
        <label class="choice-card choice-card--extra ${checked ? 'is-selected' : ''}" for="extra-${extraId}">
          <input class="choice-card__input" type="checkbox" name="extra" id="extra-${extraId}" value="${extraId}" ${checked ? 'checked' : ''}>
          <span class="choice-card__icon">${icon(extra.icon)}</span>
          <span class="choice-card__body">
            <span class="choice-card__title">${extra.name}</span>
            <span class="choice-card__text">${extra.description}</span>
          </span>
          ${price ? `<span class="choice-card__price">+${formatCurrency(price.price)}</span>` : ''}
          <span class="choice-card__check choice-card__check--box">${icon('check')}</span>
        </label>`;
    }).join('');

    return `
      <fieldset class="fieldset" id="field-propertyType" aria-describedby="field-propertyType-error">
        <legend class="fieldset__legend">Property type</legend>
        <div class="choice-grid choice-grid--3">${propertyCards}</div>
        <p class="field__error" id="field-propertyType-error"></p>
      </fieldset>

      <div class="fieldset">
        <h3 class="fieldset__legend">Property details</h3>
        <div class="property-fields">${steppers}${sizeHtml}</div>
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset__legend">Additional services <span class="field__optional">(optional)</span></legend>
        <p class="fieldset__hint">Extra prices are demo values for the estimate only.</p>
        <div class="choice-grid choice-grid--2">${extraCards}</div>
      </fieldset>

      <div class="inline-summary" aria-live="polite">
        <span class="inline-summary__icon">${icon('info')}</span>
        <span><strong>Your selection:</strong> ${esc(describeProperty())}${state.extras.length ? ` · ${ui.pluralise(state.extras.length, 'extra')}` : ''}</span>
      </div>`;
  }

  /** "Apartment · 2 bedrooms · 1 bathroom · 70 m²" */
  function describeProperty(s = state) {
    const service = data.getService(s.serviceId);
    if (!service) return '';
    const { fields } = service.form;
    const parts = [];
    if (s.propertyType) parts.push(data.PROPERTY_TYPES[s.propertyType].name);
    else parts.push('Property type not selected');
    if (fields.bedrooms) parts.push(countLabel(fields.bedrooms, s.bedrooms));
    if (fields.bathrooms) parts.push(countLabel(fields.bathrooms, s.bathrooms));
    if (fields.size && String(s.size).trim()) parts.push(`${s.size} ${fields.size.unit}`);
    return parts.join(' · ');
  }

  /* ---------- Step 3: Date & time ---------- */
  function getWeekdayNames() {
    const { weekStartsOn } = data.CALENDAR_CONFIG;
    const shortFmt = new Intl.DateTimeFormat('en-IE', { weekday: 'short' });
    const longFmt = new Intl.DateTimeFormat('en-IE', { weekday: 'long' });
    // 7 Jan 2024 was a Sunday (day index 0).
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2024, 0, 7 + ((weekStartsOn + i) % 7));
      return { short: shortFmt.format(date), long: longFmt.format(date) };
    });
  }

  function ensureCalendarView() {
    if (calendarView.year) return;
    const { min } = getDateBounds();
    const base = state.date ? ui.parseISODate(state.date) : min;
    calendarView.year = base.getFullYear();
    calendarView.month = base.getMonth();
  }

  function renderCalendar() {
    ensureCalendarView();
    const { year, month } = calendarView;
    const { today, min, max } = getDateBounds();
    const { weekStartsOn } = data.CALENDAR_CONFIG;
    const monthLabel = new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
    const canGoPrev = new Date(year, month, 1) > new Date(min.getFullYear(), min.getMonth(), 1);
    const canGoNext = new Date(year, month, 1) < new Date(max.getFullYear(), max.getMonth(), 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
    const todayIso = ui.toISODate(today);

    // Roving tabindex target: focused date > selected date > first selectable date > 1st of month.
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const inMonth = (iso) => iso && iso.startsWith(monthPrefix);
    let tabTarget = [calendarView.focusedDate, state.date].find(inMonth);
    if (!tabTarget) {
      for (let d = 1; d <= daysInMonth; d += 1) {
        const iso = ui.toISODate(new Date(year, month, d));
        if (isDateSelectable(iso)) {
          tabTarget = iso;
          break;
        }
      }
    }
    tabTarget = tabTarget || `${monthPrefix}01`;

    const weekdays = getWeekdayNames()
      .map((day) => `<span class="calendar__weekday"><abbr title="${day.long}">${day.short}</abbr></span>`)
      .join('');

    let cells = '<span class="calendar__blank"></span>'.repeat(offset);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const iso = ui.toISODate(date);
      const selectable = date >= min && date <= max;
      const selected = state.date === iso;
      const classes = ['calendar__day', selected && 'is-selected', iso === todayIso && 'is-today', !selectable && 'is-disabled']
        .filter(Boolean).join(' ');
      cells += `
        <button type="button" class="${classes}" id="day-${iso}" data-date="${iso}"
          aria-label="${ui.formatLongDate(iso)}${iso === todayIso ? ' (today)' : ''}${selectable ? '' : ', unavailable'}"
          aria-pressed="${selected}" ${selectable ? '' : 'aria-disabled="true"'} tabindex="${iso === tabTarget ? 0 : -1}">${d}</button>`;
    }

    return `
      <div class="calendar">
        <div class="calendar__header">
          <button type="button" class="calendar__nav" id="cal-prev" data-cal-nav="-1" aria-label="Previous month" ${canGoPrev ? '' : 'aria-disabled="true"'}>${icon('chevronLeft')}</button>
          <h3 class="calendar__month" id="cal-month" aria-live="polite">${monthLabel}</h3>
          <button type="button" class="calendar__nav" id="cal-next" data-cal-nav="1" aria-label="Next month" ${canGoNext ? '' : 'aria-disabled="true"'}>${icon('chevronRight')}</button>
        </div>
        <p class="visually-hidden" id="cal-help">Use the arrow keys to move between dates and press Enter to select.</p>
        <div class="calendar__weekdays" aria-hidden="true">${weekdays}</div>
        <div class="calendar__grid" role="group" aria-labelledby="cal-month" aria-describedby="cal-help">${cells}</div>
      </div>`;
  }

  function renderDateTimeStep() {
    const slots = data.DEMO_TIME_SLOTS.map((slot) => {
      const id = `time-${slot.replace(':', '')}`;
      const checked = state.time === slot;
      return `
        <label class="slot ${checked ? 'is-selected' : ''}" for="${id}">
          <input class="slot__input" type="radio" name="time" id="${id}" value="${slot}" ${checked ? 'checked' : ''}>
          <span>${slot}</span>
        </label>`;
    }).join('');

    const selection = state.date
      ? `<strong>${ui.formatLongDate(state.date)}</strong>${state.time ? ` at <strong>${state.time}</strong>` : ' — now choose a time'}`
      : 'No date selected yet.';

    return `
      <div class="datetime">
        <div class="datetime__calendar">
          <h3 class="fieldset__legend">Choose a date</h3>
          ${renderCalendar()}
        </div>
        <fieldset class="fieldset datetime__slots">
          <legend class="fieldset__legend">Choose a time</legend>
          <p class="notice notice--demo">${icon('info')} <span><strong>Demo time slots</strong> — these are examples only and do not reflect real availability.</span></p>
          <div class="slot-grid">${slots}</div>
          <div class="inline-summary" aria-live="polite">
            <span class="inline-summary__icon">${icon('calendarCheck')}</span>
            <span>${selection}</span>
          </div>
        </fieldset>
      </div>`;
  }

  /* ---------- Step 4: Customer details ---------- */
  function renderCustomerField(field) {
    const id = `field-${field.name}`;
    const value = esc(state.customer[field.name]);
    const describedBy = [field.hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
    const common = `class="field__input" id="${id}" name="${field.name}" data-customer="${field.name}"
      aria-describedby="${describedBy}" ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
      ${field.required ? 'required aria-required="true"' : ''}`;
    const control = field.type === 'textarea'
      ? `<textarea ${common} rows="4">${value}</textarea>`
      : `<input ${common} type="${field.type}" value="${value}" ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''}
          ${field.transform === 'uppercase' ? 'autocapitalize="characters"' : ''}>`;
    const counter = field.type === 'textarea'
      ? `<span class="field__counter" id="${id}-counter">${state.customer[field.name].length}/${field.maxLength}</span>` : '';

    return `
      <div class="field field--${field.width}">
        <label class="field__label" for="${id}">
          ${field.label} ${field.required ? '' : '<span class="field__optional">(optional)</span>'}
        </label>
        ${control}
        <div class="field__meta">
          ${field.hint ? `<p class="field__hint" id="${id}-hint">${field.hint}</p>` : ''}
          ${counter}
        </div>
        <p class="field__error" id="${id}-error"></p>
      </div>`;
  }

  function renderCustomerStep() {
    return `
      <div class="form-grid">${CUSTOMER_FIELDS.map(renderCustomerField).join('')}</div>
      <p class="notice">${icon('shield')} <span>Demo version: your details stay in this browser tab only. They are not sent or stored anywhere.</span></p>`;
  }

  /* ---------- Step 5: Review ---------- */
  function reviewBlock(title, step, rows) {
    const items = rows
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([label, value]) => `<div class="review-row"><dt>${label}</dt><dd>${value}</dd></div>`)
      .join('');
    return `
      <section class="review-block">
        <div class="review-block__header">
          <h3 class="review-block__title">${title}</h3>
          <button type="button" class="link-btn" data-goto="${step}">${icon('edit')} Edit<span class="visually-hidden"> ${title.toLowerCase()}</span></button>
        </div>
        <dl class="review-list">${items}</dl>
      </section>`;
  }

  function renderPriceBreakdown(estimate) {
    if (!estimate) return '';
    const lines = estimate.lines
      .map((line) => `<div class="price-line"><span>${esc(line.label)}</span><span>${formatCurrency(line.amount)}</span></div>`)
      .join('');
    return `
      <div class="price-box">
        <div class="price-box__header">
          <h3 class="review-block__title">Estimated price</h3>
          <span class="badge badge--demo">Demo estimate</span>
        </div>
        <div class="price-lines">${lines}</div>
        <div class="price-line price-line--total"><span>Estimated total</span><span>${formatCurrency(estimate.total)}</span></div>
        <p class="price-box__duration">${icon('clock')} Estimated duration: approx. ${ui.formatHours(estimate.hours)}</p>
        <p class="price-box__note">Demonstration values only — not a final price. Final pricing would be confirmed by our team.</p>
      </div>`;
  }

  function renderReviewStep() {
    const service = getCurrentService();
    const c = state.customer;
    const extras = state.extras.length
      ? state.extras.map((id) => esc(data.EXTRAS[id].name)).join(', ')
      : 'None';
    const address = [c.address1, c.address2, c.city, formatEircode(c.eircode)]
      .filter((part) => String(part).trim())
      .map(esc)
      .join(', ');

    return `
      <div class="review">
        ${reviewBlock('Service', 1, [['Service', esc(service ? service.name : '')]])}
        ${reviewBlock('Property', 2, [['Details', esc(describeProperty())], ['Additional services', extras]])}
        ${reviewBlock('Date & time', 3, [['Date', state.date ? ui.formatLongDate(state.date) : ''], ['Time', state.time ? `${state.time} <small>(demo slot)</small>` : '']])}
        ${reviewBlock('Contact & address', 4, [
          ['Name', esc(c.fullName)],
          ['Email', esc(c.email)],
          ['Phone', esc(c.phone)],
          ['Address', address],
          ['Instructions', esc(c.instructions)]
        ])}
        ${renderPriceBreakdown(estimatePrice())}
        <p class="notice notice--demo">${icon('info')} <span>Submitting is a simulation. No real booking will be created and no data will be sent.</span></p>
      </div>`;
  }

  const STEP_RENDERERS = [renderServiceStep, renderPropertyStep, renderDateTimeStep, renderCustomerStep, renderReviewStep];

  function renderStep() {
    els.step.innerHTML = renderStepHeader() + STEP_RENDERERS[currentStep - 1]();
    els.back.hidden = currentStep === 1;
    els.next.innerHTML = currentStep === TOTAL_STEPS
      ? `Submit Booking Request ${icon('check')}`
      : `Continue ${icon('arrowRight')}`;
  }

  /* ---------- Summary sidebar ---------- */
  function summaryRow(iconName, label, value, muted = false) {
    return `
      <div class="summary-row">
        <span class="summary-row__icon">${icon(iconName)}</span>
        <span class="summary-row__body">
          <span class="summary-row__label">${label}</span>
          <span class="summary-row__value ${muted ? 'is-muted' : ''}">${value}</span>
        </span>
      </div>`;
  }

  function renderSummary() {
    const service = getCurrentService();
    if (!service) {
      els.summary.innerHTML = `<p class="summary-empty">${icon('sparkles')} Choose a service to see your booking summary and a demo estimate.</p>`;
      els.summaryTotal.textContent = '';
      return;
    }

    const estimate = estimatePrice();
    const extras = state.extras.length ? state.extras.map((id) => esc(data.EXTRAS[id].name)).join(', ') : 'No extras';
    const dateText = state.date ? ui.formatLongDate(state.date) : 'Not selected yet';
    const timeText = state.time ? `${state.time} (demo slot)` : 'Not selected yet';

    els.summary.innerHTML = `
      ${summaryRow(service.icon, 'Service', esc(service.name))}
      ${summaryRow(state.propertyType ? data.PROPERTY_TYPES[state.propertyType].icon : 'house', 'Property', esc(describeProperty()))}
      ${summaryRow('plus', 'Extras', extras, !state.extras.length)}
      ${summaryRow('calendar', 'Date', dateText, !state.date)}
      ${summaryRow('clock', 'Time', timeText, !state.time)}
      ${estimate ? `
        <div class="summary-estimate">
          <div class="summary-estimate__row">
            <span>Estimated total</span>
            <strong class="summary-estimate__total">${formatCurrency(estimate.total)}</strong>
          </div>
          <p class="summary-estimate__duration">Approx. ${ui.formatHours(estimate.hours)}</p>
          <p class="badge badge--demo">Demo estimate — not a final price</p>
        </div>` : ''}`;
    els.summaryTotal.textContent = estimate ? formatCurrency(estimate.total) : '';
  }

  /* ---------- Errors ---------- */
  function clearFieldErrors() {
    els.step.querySelectorAll('.field__error').forEach((el) => { el.textContent = ''; });
    els.step.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  }

  function setFieldError(fieldName, message) {
    const input = document.getElementById(`field-${fieldName}`);
    const error = document.getElementById(`field-${fieldName}-error`);
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (error) error.textContent = message;
  }

  function clearErrors() {
    errorsVisible = false;
    els.error.hidden = true;
    els.error.innerHTML = '';
    clearFieldErrors();
  }

  function showErrors(errors, { focus = true } = {}) {
    errorsVisible = true;
    clearFieldErrors();
    els.error.innerHTML = `
      <span class="alert__icon">${icon('alert')}</span>
      <div>
        <p class="alert__title">${errors.length === 1 ? 'Please check one thing before continuing:' : 'Please check the following before continuing:'}</p>
        <ul class="alert__list">${errors.map((e) => `<li>${esc(e.message)}</li>`).join('')}</ul>
      </div>`;
    els.error.hidden = false;
    errors.forEach((e) => { if (e.field) setFieldError(e.field, e.message); });

    if (!focus) return;
    const firstField = errors.find((e) => e.field && document.getElementById(`field-${e.field}`));
    const target = firstField ? document.getElementById(`field-${firstField.field}`) : els.error;
    if (target.tagName === 'FIELDSET') {
      const input = target.querySelector('input');
      (input || els.error).focus();
    } else {
      target.focus();
    }
    if (target !== els.error) els.error.scrollIntoView({ block: 'nearest' });
  }

  function refreshErrors() {
    const errors = getStepErrors(currentStep);
    if (errors.length) showErrors(errors, { focus: false });
    else clearErrors();
  }

  /** Re-renders the current step and restores keyboard focus by element id. */
  function rerender() {
    const activeId = document.activeElement && document.activeElement.id;
    renderStep();
    renderProgress();
    renderSummary();
    if (errorsVisible) refreshErrors();
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) el.focus({ preventScroll: true });
    }
  }

  /* ---------- Confirmation ---------- */
  function generateDemoReference() {
    return `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  function renderConfirmation() {
    const service = getCurrentService();
    const firstName = esc(state.customer.fullName.trim().split(/\s+/)[0]);
    els.confirmation.innerHTML = `
      <div class="confirmation card">
        <span class="confirmation__icon">${icon('checkCircle')}</span>
        <h2 class="confirmation__title" id="confirmation-title" tabindex="-1">Booking request received</h2>
        <p class="confirmation__lead">Thank you, ${firstName}. This is how your request would look once submitted.</p>

        <div class="alert alert--demo" role="status">
          <span class="alert__icon">${icon('info')}</span>
          <div>
            <p class="alert__title">This is a simulation</p>
            <p>No real booking has been created, no payment has been taken and your details have not been sent or stored anywhere.</p>
          </div>
        </div>

        <dl class="review-list confirmation__details">
          <div class="review-row"><dt>Demo reference</dt><dd><strong>${submittedReference}</strong></dd></div>
          <div class="review-row"><dt>Service</dt><dd>${esc(service.name)}</dd></div>
          <div class="review-row"><dt>Date &amp; time</dt><dd>${ui.formatLongDate(state.date)} at ${state.time}</dd></div>
          <div class="review-row"><dt>Address</dt><dd>${esc(state.customer.address1)}, ${esc(state.customer.city)}, ${esc(formatEircode(state.customer.eircode))}</dd></div>
        </dl>

        <div class="confirmation__actions">
          <a class="btn btn--outline" href="#home">Back to Home</a>
          <button type="button" class="btn btn--primary" data-action="restart">Start a new booking</button>
        </div>
      </div>`;
  }

  /* =========================================================
   * 5. Navigation & events
   * ======================================================= */

  function scrollToFlowTop() {
    const target = els.root.querySelector('.booking__header');
    const header = document.getElementById('site-header');
    const offset = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top;
    if (top < offset || top > window.innerHeight * 0.5) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - offset - 16), behavior: 'instant' });
    }
  }

  function goToStep(step, { focus = true } = {}) {
    if (step < 1 || step > TOTAL_STEPS) return;
    currentStep = step;
    clearErrors();
    renderStep();
    renderProgress();
    renderSummary();
    scrollToFlowTop();
    if (focus) document.getElementById('step-title').focus({ preventScroll: true });
  }

  function goNext() {
    const errors = getStepErrors(currentStep);
    if (errors.length) {
      showErrors(errors);
      return;
    }
    goToStep(currentStep + 1);
  }

  function submitBooking() {
    for (let step = 1; step < TOTAL_STEPS; step += 1) {
      if (!isStepValid(step)) {
        goToStep(step);
        showErrors(getStepErrors(step));
        return;
      }
    }
    // Simulation only: nothing is sent to a server and nothing is persisted.
    submittedReference = generateDemoReference();
    renderConfirmation();
    els.flow.hidden = true;
    els.confirmation.hidden = false;
    scrollToFlowTop();
    document.getElementById('confirmation-title').focus({ preventScroll: true });
  }

  function reset() {
    state = createInitialState();
    currentStep = 1;
    submittedReference = null;
    calendarView.year = 0;
    calendarView.month = 0;
    calendarView.focusedDate = null;
    els.flow.hidden = false;
    els.confirmation.hidden = true;
    els.confirmation.innerHTML = '';
    clearErrors();
    renderStep();
    renderProgress();
    renderSummary();
  }

  function changeMonth(delta) {
    const { min, max } = getDateBounds();
    const next = new Date(calendarView.year, calendarView.month + delta, 1);
    if (next < new Date(min.getFullYear(), min.getMonth(), 1) || next > new Date(max.getFullYear(), max.getMonth(), 1)) return;
    calendarView.year = next.getFullYear();
    calendarView.month = next.getMonth();
    calendarView.focusedDate = null;
    rerender();
  }

  /** Arrow-key navigation inside the calendar grid. */
  function handleCalendarKeydown(event, button) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const current = ui.parseISODate(button.dataset.date);
    let target = null;

    if (event.key in moves) {
      target = new Date(current.getFullYear(), current.getMonth(), current.getDate() + moves[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      const dayIndex = (current.getDay() - data.CALENDAR_CONFIG.weekStartsOn + 7) % 7;
      const shift = event.key === 'Home' ? -dayIndex : 6 - dayIndex;
      target = new Date(current.getFullYear(), current.getMonth(), current.getDate() + shift);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const delta = event.key === 'PageUp' ? -1 : 1;
      const lastDay = new Date(current.getFullYear(), current.getMonth() + delta + 1, 0).getDate();
      target = new Date(current.getFullYear(), current.getMonth() + delta, Math.min(current.getDate(), lastDay));
    } else {
      return;
    }
    event.preventDefault();

    // Keep focus within the months the calendar can show.
    const { min, max } = getDateBounds();
    const firstVisible = new Date(min.getFullYear(), min.getMonth(), 1);
    const lastVisible = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    if (target < firstVisible) target = firstVisible;
    if (target > lastVisible) target = lastVisible;

    const iso = ui.toISODate(target);
    calendarView.year = target.getFullYear();
    calendarView.month = target.getMonth();
    calendarView.focusedDate = iso;
    rerender();
    const dayButton = document.getElementById(`day-${iso}`);
    if (dayButton) dayButton.focus();
  }

  function handleStepChange(event) {
    const { target } = event;
    switch (target.name) {
      case 'service':
        selectService(target.value);
        break;
      case 'propertyType':
        state.propertyType = target.value;
        break;
      case 'extra':
        toggleExtra(target.value, target.checked);
        break;
      case 'time':
        state.time = target.value;
        break;
      default:
        return;
    }
    rerender();
  }

  function handleStepClick(event) {
    const stepper = event.target.closest('[data-stepper]');
    if (stepper) {
      if (stepper.getAttribute('aria-disabled') === 'true') return;
      const name = stepper.dataset.stepper;
      const field = getCurrentService().form.fields[name];
      const value = state[name] + Number(stepper.dataset.delta);
      state[name] = Math.min(field.max, Math.max(field.min, value));
      rerender();
      return;
    }

    const day = event.target.closest('[data-date]');
    if (day) {
      if (day.getAttribute('aria-disabled') === 'true') return;
      state.date = day.dataset.date;
      calendarView.focusedDate = state.date;
      rerender();
      return;
    }

    const calNav = event.target.closest('[data-cal-nav]');
    if (calNav) {
      if (calNav.getAttribute('aria-disabled') === 'true') return;
      changeMonth(Number(calNav.dataset.calNav));
      return;
    }

    const goto = event.target.closest('[data-goto]');
    if (goto) goToStep(Number(goto.dataset.goto));
  }

  function handleStepInput(event) {
    const { target } = event;

    if (target.id === 'field-size') {
      state.size = target.value;
      renderSummary();
      if (errorsVisible) refreshErrors();
      return;
    }

    const customerField = target.dataset.customer;
    if (customerField) {
      state.customer[customerField] = target.value;
      const counter = document.getElementById(`${target.id}-counter`);
      if (counter) counter.textContent = `${target.value.length}/${target.maxLength}`;
      if (errorsVisible) refreshErrors();
      else if (target.getAttribute('aria-invalid') === 'true') {
        const field = CUSTOMER_FIELDS.find((f) => f.name === customerField);
        setFieldError(customerField, validateCustomerField(field, target.value));
      }
    }
  }

  /** Validates a customer field when the user leaves it (only if something was typed). */
  function handleStepFocusOut(event) {
    const { target } = event;
    const customerField = target.dataset.customer;
    if (!customerField) return;
    const field = CUSTOMER_FIELDS.find((f) => f.name === customerField);

    if (customerField === 'eircode' && isValidEircode(target.value)) {
      target.value = formatEircode(target.value);
      state.customer.eircode = target.value;
    }
    if (target.value.trim() || target.getAttribute('aria-invalid') === 'true') {
      setFieldError(customerField, validateCustomerField(field, target.value));
    }
  }

  function handleStepKeydown(event) {
    const day = event.target.closest('[data-date]');
    if (day) handleCalendarKeydown(event, day);
  }

  function setupSummaryToggle() {
    const mobileQuery = window.matchMedia('(max-width: 1023px)');
    const sync = () => { els.summaryCard.open = !mobileQuery.matches; };
    sync();
    mobileQuery.addEventListener('change', sync);
  }

  function init() {
    els.root = document.getElementById('view-booking');
    els.flow = document.getElementById('booking-flow');
    els.form = document.getElementById('booking-form');
    els.step = document.getElementById('booking-step');
    els.progress = document.getElementById('booking-progress');
    els.progressFill = document.getElementById('progress-fill');
    els.back = document.getElementById('booking-back');
    els.next = document.getElementById('booking-next');
    els.error = document.getElementById('booking-error');
    els.summary = document.getElementById('booking-summary');
    els.summaryTotal = document.getElementById('summary-total');
    els.summaryCard = document.getElementById('summary-card');
    els.confirmation = document.getElementById('booking-confirmation');
    if (!els.root) return;

    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (currentStep < TOTAL_STEPS) goNext();
      else submitBooking();
    });
    els.back.addEventListener('click', () => goToStep(currentStep - 1));
    els.progress.addEventListener('click', (event) => {
      const button = event.target.closest('[data-goto]');
      if (button && !button.disabled) goToStep(Number(button.dataset.goto));
    });
    els.step.addEventListener('change', handleStepChange);
    els.step.addEventListener('click', handleStepClick);
    els.step.addEventListener('input', handleStepInput);
    els.step.addEventListener('focusout', handleStepFocusOut);
    els.step.addEventListener('keydown', handleStepKeydown);
    els.confirmation.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="restart"]')) {
        reset();
        document.getElementById('step-title').focus();
      }
    });

    setupSummaryToggle();
    renderStep();
    renderProgress();
    renderSummary();
  }

  /**
   * Called by the router when the booking view is shown.
   * A valid `serviceId` pre-selects the service and jumps to step 2.
   */
  function open({ serviceId } = {}) {
    if (submittedReference) reset();
    if (serviceId && data.getService(serviceId)) {
      selectService(serviceId);
      goToStep(2, { focus: false });
    } else {
      clearErrors();
      renderStep();
      renderProgress();
      renderSummary();
    }
  }

  CleanerApp.booking = {
    init,
    open,
    reset,
    estimatePrice,
    getStepErrors,
    selectService,
    getState: () => JSON.parse(JSON.stringify(state)),
    validators: {
      EIRCODE_PATTERN,
      isValidEircode,
      formatEircode,
      isValidEmail,
      isValidIrishPhone
    }
  };
})(window);
