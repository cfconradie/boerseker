/*! Boerseker self-bootstrapping widget */
(function () {
  // 1. Inject stylesheet via DOM (bypasses host-page <link> sanitizers).
  if (!document.getElementById('boerseker-style')) {
    var l = document.createElement('link');
    l.id = 'boerseker-style';
    l.rel = 'stylesheet';
    l.href = 'https://cdn.jsdelivr.net/gh/cfconradie/boerseker@main/dist/style.css';
    document.head.appendChild(l);
  }

  // 2. Template (extracted from index.html).
  var __BOERSEKER_TPL__ = `<div id="boerseker-app" v-cloak> <div v-show="currentStep === 1" class="step1-wrapper"> <div class="boerseker-calc"> <div class="calc-heading-row"> <h1 class="calc-heading">Hoeveel het jy nodig?</h1> <details class="calc-ai-help"> <summary aria-label="Wys meer konteks">i</summary> <div class="calc-ai-pop" role="note"> <strong>Hoe werk hierdie skatting?</strong> <p>Dis 'n vinnige riglyn op grond van die bedrag wat jy invul. Geen kredietkontrole gebeur op hierdie stap nie. Jou finale syfer hang af van jou bates, kredietprofiel en termyn.</p> </div> </details> </div> <div class="calc-card"> <label class="calc-label" for="calc-amount-input">Ek benodig</label> <div class="calc-input-wrapper"> <span class="calc-input-prefix" aria-hidden="true">R</span> <input id="calc-amount-input" class="calc-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="500 000" :value="displayAmount" @input="handleInput" aria-describedby="calc-helper"> </div> <p class="calc-helper" id="calc-helper" :class="{ 'is-error': helperIsError }">{{ helperText }}</p> <transition name="fade-up"> <div v-show="isValid" class="calc-result" aria-live="polite"> <p class="calc-result-label">Bates ter waarde van</p> <p class="calc-result-range">{{ formattedLower }} – {{ formattedUpper }}</p> <p class="calc-result-sentence">kan die lening moontlik maak</p> </div> </transition> </div> <transition name="fade-up"> <div v-show="isValid" class="advisor"> <div class="cta-soft-choice" style="margin-left: 0;"> <button class="cta-primary" type="button" @click="goToStep2"> Ek stel belang <span class="cta-primary-arrow" aria-hidden="true">→</span> </button> </div> <p style="margin-top: var(--space-3); font-size: 0.8125rem; color: var(--color-muted);"> <a href="https://boerseker.vercel.app/terme.pdf" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline; text-underline-offset: 2px;">Terme en voorwaardes</a> </p> </div> </transition> </div> </div> <template v-if="currentStep === 2 && !showFinalResult"> <div class="boerseker-complex-calc"> <div class="step-indicator"> <div class="step-indicator-row"> <template v-for="(s, i) in WIZARD_STEPS" :key="s.n"> <button type="button" class="step-dot" :class="{
                          'is-active': wizardStep === s.n,
                          'is-done':   wizardStep >  s.n,
                          'is-clickable': wizardStep > s.n
                        }" :disabled="wizardStep <= s.n" @click="wizardStep > s.n && goToWizardStep(s.n)"> <span class="step-dot-circle">{{ wizardStep > s.n ? '✓' : s.n }}</span> <span class="step-dot-label">{{ s.label }}</span> </button> <span v-if="i < WIZARD_STEPS.length - 1" class="step-connector" :class="{ 'is-done': wizardStep > s.n }"></span> </template> </div> </div> <main v-if="wizardStep === 1" class="calc-main"> <section> <h2 class="section-heading">Afbetaalde bates waarteen jy wil leen</h2> <div class="add-card"> <div class="add-field"> <label class="add-field-label">Kies jou bate</label> <div class="chip-group" role="radiogroup" aria-label="Bate kategorie"> <button v-for="cat in CATEGORIES" :key="cat.id" type="button" class="chip" :class="{ 'is-active': draftCategory === cat.id }" :aria-pressed="draftCategory === cat.id" @click="draftCategory = cat.id"> <span class="chip-icon" aria-hidden="true">{{ cat.icon }}</span> <span>{{ cat.label }}</span> </button> </div> </div> <div class="add-field"> <label class="add-field-label" for="draft-value">Huidige mark waarde</label> <div class="add-input-wrapper"> <span class="add-input-prefix" aria-hidden="true">R</span> <input id="draft-value" class="add-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="1 200 000" :value="draftValueDisplay" @input="handleValueInput"> </div> </div> <div class="add-field"> <label class="add-field-label">Jaar beskrywing</label> <div class="chip-group" role="radiogroup" aria-label="Ouderdom"> <button v-for="age in AGE_BRACKETS" :key="age.id" type="button" class="chip" :class="{ 'is-active': draftAge === age.id }" :aria-pressed="draftAge === age.id" @click="draftAge = age.id"> {{ age.label }} </button> </div> </div> <div class="add-field"> <label class="add-field-label">Toestand van bate</label> <div class="chip-group" role="radiogroup" aria-label="Toestand"> <button v-for="cond in CONDITIONS" :key="cond.id" type="button" class="chip" :class="{ 'is-active': draftCondition === cond.id }" :aria-pressed="draftCondition === cond.id" @click="draftCondition = cond.id"> {{ cond.label }} </button> </div> </div> <button type="button" class="voeg-by" :class="{ 'is-flash': addFlash }" :disabled="!draftIsValid" @click="addAsset">{{ draftIsValid ? '✓ Dien in' : 'Vul die 4 velde in' }}</button> </div> </section> <div v-if="assets.length > 0" class="progress-inline-wrapper" role="status" aria-live="polite"> <button type="button" class="progress-inline-btn" @click="scrollToAddCard" :aria-label="'Vordering: ' + progressPctLabel + ' van ' + formatZAR(loanGoal)"> <div class="progress-inline-header"> <span class="progress-inline-current">{{ formatZAR(totalMaxLoan) }} <span class="progress-inline-pct">{{ progressPctLabel }}</span></span> <span class="progress-inline-goal">Doel: {{ formatZAR(loanGoal) }}</span> </div> <div class="progress-track" role="progressbar" :aria-valuenow="Math.round(progressPct)" aria-valuemin="0" aria-valuemax="100"> <div class="progress-fill" :style="{ width: progressFillWidth, background: progressBarColor }"></div> </div> <p class="progress-inline-text" :class="{ 'is-reached': goalReached }">{{ progressMessage }}</p> </button> </div> <section class="list-section"> <h2 class="section-heading">Jou bates ({{ assets.length }})</h2> <div v-if="assets.length === 0" class="empty-state"> Voeg jou eerste bate hierbo by om te begin. </div> <transition-group v-else name="asset-card" tag="ul" class="asset-list"> <li v-for="asset in assets" :key="asset.id" class="asset-card"> <span class="asset-icon" aria-hidden="true">{{ getCategory(asset.category_id).icon }}</span> <div class="asset-body"> <div class="asset-title"> {{ getCategory(asset.category_id).label }} <span class="asset-value">{{ formatZAR(asset.market_value) }}</span> </div> <div class="asset-meta"> {{ getAge(asset.age_id).label }} · {{ getCondition(asset.condition_id).label }} · dra by ≈ <strong>{{ formatZAR(getAssetContribution(asset)) }}</strong> </div> </div> <button type="button" class="asset-delete" @click="removeAsset(asset.id)" :aria-label="'Verwyder ' + getCategory(asset.category_id).label"> ✕ </button> </li> </transition-group> </section> </main> <div v-if="wizardStep === 1" class="sticky-cta-bar"> <button type="button" class="wizard-nav-next" style="width: 100%;" :disabled="assets.length === 0" @click="nextWizardStep"> {{ assets.length === 0 ? 'Voeg minstens een bate by' : (goalReached ? '✓ Volgende' : 'Volgende') }} </button> </div> <main v-if="wizardStep === 2" class="calc-main"> <h2 class="section-heading">Hoe wil jy leen</h2> <div class="add-card"> <div class="add-field"> <label class="add-field-label">Aansoek as</label> <div class="chip-group" role="radiogroup" aria-label="Aansoek tipe"> <button type="button" class="chip" :class="{ 'is-active': applicantType === 'individu' }" :aria-pressed="applicantType === 'individu'" @click="applicantType = 'individu'"> <span class="chip-icon" aria-hidden="true">👤</span> <span>Individu</span> </button> <button type="button" class="chip" :class="{ 'is-active': applicantType === 'besigheid' }" :aria-pressed="applicantType === 'besigheid'" @click="applicantType = 'besigheid'"> <span class="chip-icon" aria-hidden="true">🏢</span> <span>Besigheid</span> </button> </div> </div> <div class="add-field"> <label class="add-field-label">Krediet status</label> <div class="chip-group"> <button v-for="cr in CREDIT_OPTIONS" :key="cr.id" type="button" class="chip" :class="{ 'is-active': creditRecord === cr.id }" :aria-pressed="creditRecord === cr.id" @click="creditRecord = cr.id"> {{ cr.label }} </button> </div> <p class="field-help"> Uitstekend = geen versuimings · Goed = 1–2 · Het werk nodig = 3+ of tans agterstallig </p> </div> <div class="add-field"> <label class="add-field-label">Betalingswyse</label> <div class="chip-group" role="radiogroup" aria-label="Betalingswyse"> <button type="button" class="chip" :class="{ 'is-active': paymentFrequency === 'monthly' }" :aria-pressed="paymentFrequency === 'monthly'" @click="paymentFrequency = 'monthly'"> Maandeliks </button> <button type="button" class="chip" :class="{ 'is-active': paymentFrequency === 'biannual' }" :aria-pressed="paymentFrequency === 'biannual'" @click="paymentFrequency = 'biannual'"> Halfjaarliks </button> <button type="button" class="chip" :class="{ 'is-active': paymentFrequency === 'annual' }" :aria-pressed="paymentFrequency === 'annual'" @click="paymentFrequency = 'annual'"> Jaarliks </button> </div> </div> <div class="add-field"> <label class="add-field-label">Termyn (maande)</label> <div class="chip-group"> <button v-for="term in TERM_OPTIONS" :key="term" type="button" class="chip" :class="{ 'is-active': loanTermMonths === term }" :aria-pressed="loanTermMonths === term" @click="loanTermMonths = term"> {{ term }} mnd </button> </div> </div> <div class="add-field"> <label class="add-field-label" for="krediet-rate">Jaarlikse rente koers</label> <div class="add-input-wrapper"> <input id="krediet-rate" class="add-input" type="number" inputmode="decimal" step="0.5" min="0" max="40" :value="annualInterestRatePct" @input="handleRateInput"> <span class="add-input-prefix" aria-hidden="true">%</span> </div> <p class="field-help">Die koers is onderhewig aan 'n assessering van jou kredietrekord en betalings-vermoë.</p> <div class="stat-row"> <div class="stat"> <span class="stat-label">Leenbedrag</span> <span class="stat-value">{{ formatZAR(aggregate.max_loan) }}</span> </div> <div class="stat"> <span class="stat-label">{{ displayPaymentLabel }}</span> <span class="stat-value stat-value-primary">{{ formatZAR(displayPayment) }}</span> </div> <div class="stat"> <span class="stat-label">Totale terugbetaling</span> <span class="stat-value">{{ formatZAR(aggregate.total_repayment) }}</span> </div> </div> </div> </div> <div v-if="assets.length > 0" class="live-summary-strip" aria-live="polite"> <span class="live-summary-strip-label">{{ displayPaymentLabel }}</span> <span> <span class="live-summary-strip-amount">{{ formatZAR(displayPayment) }}</span> <span class="live-summary-strip-suffix"> vir {{ loanTermMonths }} mnd</span> </span> </div> <div class="wizard-nav"> <button type="button" class="wizard-nav-back" @click="prevWizardStep">← Terug</button> <button type="button" class="wizard-nav-next" @click="nextWizardStep">Volgende</button> </div> </main> <main v-if="wizardStep === 3" class="calc-main"> <h2 class="section-heading">Kontakbesonderhede</h2> <form class="add-card" @submit.prevent="submitLead" novalidate> <template v-if="applicantType === 'besigheid'"> <div class="lead-form-field"> <label class="lead-form-label" for="lead-company-name">Maatskappynaam</label> <input id="lead-company-name" class="lead-form-input" :class="{ 'is-error': leadErrors.companyName }" type="text" autocomplete="organization" v-model="companyName" @blur="validateLeadField('companyName')"> <p class="lead-form-error">{{ leadErrors.companyName || '' }}</p> </div> <div class="lead-form-field"> <label class="lead-form-label" for="lead-company-reg">Registrasienommer</label> <input id="lead-company-reg" class="lead-form-input" :class="{ 'is-error': leadErrors.companyReg }" type="text" placeholder="2020/123456/07" v-model="companyReg" @blur="validateLeadField('companyReg')"> <p class="lead-form-error">{{ leadErrors.companyReg || '' }}</p> </div> <div class="lead-form-field"> <label class="lead-form-label" for="lead-company-vat">BTW-nommer (opsioneel)</label> <input id="lead-company-vat" class="lead-form-input" type="text" v-model="companyVat"> </div> </template> <div class="lead-form-field"> <label class="lead-form-label" for="lead-first-name-step">Naam</label> <input id="lead-first-name-step" class="lead-form-input" :class="{ 'is-error': leadErrors.firstName }" type="text" autocomplete="given-name" v-model="leadFirstName" @blur="validateLeadField('firstName')"> <p class="lead-form-error">{{ leadErrors.firstName || '' }}</p> </div> <div class="lead-form-field"> <label class="lead-form-label" for="lead-last-name-step">Van</label> <input id="lead-last-name-step" class="lead-form-input" :class="{ 'is-error': leadErrors.lastName }" type="text" autocomplete="family-name" v-model="leadLastName" @blur="validateLeadField('lastName')"> <p class="lead-form-error">{{ leadErrors.lastName || '' }}</p> </div> <div class="lead-form-field"> <label class="lead-form-label" for="lead-phone-step">Selfoon</label> <input id="lead-phone-step" class="lead-form-input" :class="{ 'is-error': leadErrors.phone }" type="tel" inputmode="tel" autocomplete="tel" placeholder="082" v-model="leadPhone" @blur="validateLeadField('phone')"> <p class="lead-form-error">{{ leadErrors.phone || '' }}</p> </div> <div class="lead-form-field"> <label class="lead-form-label" for="lead-email-step">E-pos</label> <input id="lead-email-step" class="lead-form-input" :class="{ 'is-error': leadErrors.email }" type="email" inputmode="email" autocomplete="email" placeholder="jy@plaas.co.za" v-model="leadEmail" @blur="validateLeadField('email')"> <p class="lead-form-error">{{ leadErrors.email || '' }}</p> </div> <p class="field-help" style="margin-top: var(--space-3);"> Boerseker maak binnekort kontak met jou. </p> <div class="wizard-nav"> <button type="button" class="wizard-nav-back" @click="prevWizardStep">← Terug</button> <button type="submit" class="wizard-nav-next" :disabled="!stepFormValid || leadSubmitting"> {{ leadSubmitting ? 'Stuur...' : 'Stuur aansoek' }} </button> </div> <div v-if="submitState === 'error'" class="submit-error" role="alert"> <strong>Hmm —</strong> {{ submitError }} <br> <a :href="'https://wa.me/' + BUSINESS_WHATSAPP">💬 WhatsApp Boerseker</a> </div> </form> </main> </div> </template> <transition name="final" appear> <section v-if="submitState === 'handoff'" class="handoff" aria-live="polite"> <div class="handoff-bubble"> Verwag 'n WhatsApp boodskap vanaf Boerseker binnekort, om met die proses te begin. <span class="handoff-typing" aria-hidden="true"><span></span><span></span><span></span></span> </div> </section> </transition> <transition name="final" appear> <section v-if="showFinalResult" class="final-result"> <div class="final-checkmark" aria-hidden="true">✓</div> <p class="final-greeting">Dankie, <strong>{{ leadFirstName }}</strong></p> <p class="final-label">Jy kwalifiseer vir tot</p> <p class="final-amount">{{ formatZAR(finalResult.max_loan) }}</p> <dl class="final-details"> <dt>{{ displayPaymentLabel }}</dt> <dd>{{ formatZAR(finalDisplayPayment) }}</dd> <dt>Oor</dt> <dd>{{ loanTermMonths }} maande</dd> <dt>Totale terugbetaling</dt> <dd>{{ formatZAR(finalResult.total_repayment) }}</dd> </dl> <p class="final-promise"> Verwag 'n WhatsApp boodskap vanaf Boerseker binnekort, om met die proses te begin. </p> <div class="final-actions"> <a v-if="pdfUrl" class="final-action final-action-pdf" :href="pdfUrl" target="_blank" rel="noopener" download> ↓ Laai jou finansieringsverslag af </a> <span v-else class="final-action final-action-pdf-loading"> Verslag word gegenereer… </span> <a class="final-action final-action-facebook" href="#facebook" target="_blank" rel="noopener"> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"> <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/> </svg> Volg ons op Facebook </a> </div> <p class="final-ref">Verwysing: {{ referenceId }}</p> </section> </transition> </div>`;

  // 3. Wait for Vue + DOM, then mount.
  function boot() {
    if (typeof Vue === 'undefined') return setTimeout(boot, 20);
    if (!document.getElementById('boerseker-app')) {
      // Host page didn't include the mount div — create one.
      var d = document.createElement('div');
      d.id = 'boerseker-app';
      document.body.appendChild(d);
    }
    /* === BEGIN extracted app logic === */

      // ============================================================
      // CONSTANTS — chip labels (Afrikaans)
      // ============================================================
      const CATEGORIES = [
        { id: 'tractor',                label: 'Trekker',     icon: '🚜' },
        { id: 'attachments_implements', label: 'Bykomstukke', icon: '🔧' },
        { id: 'sprayer',                label: 'Sproei',      icon: '💦' },
        { id: 'planter',                label: 'Planter',     icon: '🌱' },
        { id: 'baler_forage',           label: 'Baler',       icon: '🌾' },
        { id: 'combine',                label: 'Stroper',     icon: '⚙️' },
        { id: 'other_machinery',        label: 'Ander',       icon: '🛠️' },
        { id: 'irrigation',             label: 'Besproeiing', icon: '💧' },
      ];

      const AGE_BRACKETS = [
        { id: 'a1', label: '0–3 jr',  years: 2  },
        { id: 'a2', label: '4–6 jr',  years: 5  },
        { id: 'a3', label: '7–10 jr', years: 8  },
        { id: 'a4', label: '11+ jr',  years: 15 },
      ];

      const CONDITIONS = [
        { id: 'excellent', label: 'Top'  },
        { id: 'good',      label: 'Goed' },
        { id: 'fair',      label: 'OK'   },
        { id: 'poor',      label: 'Sleg' },
      ];

      const CREDIT_OPTIONS = [
        { id: 'good',   label: 'Uitstekend'     },
        { id: 'medium', label: 'Goed'            },
        { id: 'weak',   label: 'Het werk nodig'  },
      ];

      const TERM_OPTIONS = [24, 36, 48, 60];

      const CRM_ENDPOINT = 'https://www.uchat.com.au/api/iwh/ef2327b168a3136bb8ac5cdf8f967af3';
      const PDF_ENDPOINT = 'https://boerseker.vercel.app/api/pdf';
      const PDF_SECRET   = 'boerseker-pdf-2026';

      // Boerseker broker contact (for fallback CTAs on final screen).
      // Replace these with real production numbers before launch.
      const BUSINESS_WHATSAPP = '27821234567'; // E.164 without +
      const BUSINESS_PHONE    = '+27821234567';
      const BUSINESS_NAME     = 'Johan';

      // ============================================================
      // CALCULATION ENGINE
      // ============================================================
      const FSF_TABLE = {
        tractor: 0.85,
        attachments_implements: 0.85,
        sprayer: 0.80,
        planter: 0.78,
        baler_forage: 0.78,
        combine: 0.70,
        other_machinery: 0.68,
        irrigation: 0.60,
      };
      const AGE_FACTOR_TABLE = [
        { min: 0, max: 3,  factor: 1.00 },
        { min: 4, max: 6,  factor: 0.90 },
        { min: 7, max: 10, factor: 0.80 },
        { min: 11, max: 99, factor: 0.65 },
      ];
      const CONDITION_FACTOR_TABLE = {
        excellent: 1.00,
        good: 0.90,
        fair: 0.80,
        poor: 0.65,
      };
      const LTV_TABLE = {
        good: 0.40,
        medium: 0.35,
        weak: 0.30,
      };

      function lookupAgeFactor(years) {
        for (const row of AGE_FACTOR_TABLE) {
          if (years >= row.min && years <= row.max) return row.factor;
        }
        return 0.65;
      }

      function calcCollateral(asset) {
        const fsf = FSF_TABLE[asset.category_id];
        const age = AGE_BRACKETS.find(b => b.id === asset.age_id);
        const af  = age ? lookupAgeFactor(age.years) : 0;
        const cf  = CONDITION_FACTOR_TABLE[asset.condition_id];
        if (!fsf || !cf || !age) return 0;
        return asset.market_value * fsf * af * cf;
      }

      function calcAggregate(assets, app) {
        const total_collateral = assets.reduce((s, a) => s + calcCollateral(a), 0);
        const ltv = LTV_TABLE[app.credit_record] ?? 0.40;
        const max_loan = total_collateral * ltv;

        const n = app.loan_term_months;
        const monthly_rate = app.annual_interest_rate / 12;
        let monthly_payment;
        if (app.annual_interest_rate === 0) {
          monthly_payment = n > 0 ? max_loan / n : 0;
        } else {
          monthly_payment = max_loan * (monthly_rate * Math.pow(1 + monthly_rate, n)) / (Math.pow(1 + monthly_rate, n) - 1);
        }
        const total_repayment = monthly_payment * n;
        const total_finance_cost = total_repayment - max_loan;

        return {
          total_collateral: Math.round(total_collateral),
          max_loan: Math.round(max_loan),
          monthly_payment: Math.round(monthly_payment),
          total_repayment: Math.round(total_repayment),
          total_finance_cost: Math.round(total_finance_cost),
        };
      }

      // ============================================================
      // VUE APP
      // ============================================================
      const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

      createApp({
  template: __BOERSEKER_TPL__,
        setup() {

          // ----- Shared -----
          const currentStep = ref(1);

          // ----- Wizard sub-steps (within currentStep === 2) -----
          const WIZARD_STEPS = [
            { n: 1, label: 'Bates' },
            { n: 2, label: 'Krediet' },
            { n: 3, label: 'Kontak' },
          ];
          const wizardStep = ref(1);
          const rateOpen = ref(true);
          const submitState = ref('idle'); // 'idle' | 'submitting' | 'handoff' | 'error'
          const submitError = ref('');
          const referenceId = ref('');
          function goToWizardStep(n) {
            if (n < 1 || n > WIZARD_STEPS.length) return;
            wizardStep.value = n;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          function nextWizardStep() {
            if (wizardStep.value === 1 && assets.value.length === 0) return;
            goToWizardStep(wizardStep.value + 1);
          }
          function prevWizardStep() { goToWizardStep(wizardStep.value - 1); }

          // ----- ZAR formatter (single instance) -----
          const zarFormat = new Intl.NumberFormat('af-ZA', {
            style: 'currency',
            currency: 'ZAR',
            maximumFractionDigits: 0,
          });
          function formatZAR(n) { return zarFormat.format(Math.round(n || 0)); }

          // ----- Validation bounds -----
          const MIN_AMOUNT = 10000;
          const MAX_AMOUNT = 100000000;

          // ==================== STEP 1 STATE ====================
          const desiredAmount = ref(null);
          const displayAmount = ref('');

          // ==================== STEP 2 STATE ====================
          const loanGoal = ref(500000);

          const draftCategory     = ref(null);
          const draftValue        = ref(null);
          const draftValueDisplay = ref('');
          const draftAge          = ref(null);
          const draftCondition    = ref(null);

          const assets = ref([]);
          let nextAssetId = 1;

          const creditRecord       = ref('good');
          const loanTermMonths     = ref(60);
          const annualInterestRate = ref(0.18);
          const paymentFrequency   = ref('monthly'); // 'monthly' | 'biannual' | 'annual'

          const leadFormOpen   = ref(false);
          const leadFirstName  = ref('');
          const leadLastName   = ref('');
          const leadPhone      = ref('');
          const leadEmail      = ref('');
          const leadErrors     = ref({});
          const applicantType  = ref('individu'); // 'individu' | 'besigheid'
          const companyName    = ref('');
          const companyReg     = ref('');
          const companyVat     = ref('');
          const leadSubmitting = ref(false);

          const showFinalResult = ref(false);
          const finalResult     = ref(null);
          const pdfUrl          = ref(null);

          const addFlash        = ref(false);
          const animatedMaxLoan = ref(0);

          // ==================== STEP 1 COMPUTEDS ====================
          const isValid = computed(() =>
            typeof desiredAmount.value === 'number'
            && desiredAmount.value >= MIN_AMOUNT
            && desiredAmount.value <= MAX_AMOUNT
          );

          const lowerBound = computed(() =>
            isValid.value ? desiredAmount.value / 0.40 : 0
          );
          const upperBound = computed(() =>
            isValid.value ? desiredAmount.value / 0.30 : 0
          );

          const formattedLower  = computed(() => zarFormat.format(lowerBound.value));
          const formattedUpper  = computed(() => zarFormat.format(upperBound.value));
          const formattedAmount = computed(() =>
            desiredAmount.value ? zarFormat.format(desiredAmount.value) : ''
          );

          const helperIsError = computed(() =>
            desiredAmount.value !== null
            && (desiredAmount.value < MIN_AMOUNT || desiredAmount.value > MAX_AMOUNT)
          );

          const helperText = computed(() => {
            if (desiredAmount.value === null) return 'Minimum R10 000';
            if (desiredAmount.value < MIN_AMOUNT) return 'Minimum R10 000';
            if (desiredAmount.value > MAX_AMOUNT) return 'Vir bedrae oor R100m, kontak ons direk';
          });

          // ==================== STEP 2 COMPUTEDS ====================
          const draftIsValid = computed(() =>
            draftCategory.value !== null
            && typeof draftValue.value === 'number'
            && draftValue.value >= 1000
            && draftAge.value !== null
            && draftCondition.value !== null
          );

          const aggregate = computed(() => calcAggregate(assets.value, {
            credit_record: creditRecord.value,
            loan_term_months: loanTermMonths.value,
            annual_interest_rate: annualInterestRate.value,
          }));

          const totalMaxLoan = computed(() => aggregate.value.max_loan);

          const progressPct = computed(() => {
            if (loanGoal.value === 0) return 0;
            return (totalMaxLoan.value / loanGoal.value) * 100;
          });

          const progressFillWidth = computed(() =>
            Math.min(100, Math.max(0, progressPct.value)) + '%'
          );

          const progressPctLabel = computed(() => Math.round(progressPct.value) + '%');

          const goalReached = computed(() => totalMaxLoan.value >= loanGoal.value && assets.value.length > 0);

          const progressMessage = computed(() => {
            if (assets.value.length === 0) return 'Voeg jou bates by om die balk te laat groei';
            if (goalReached.value) return '✓ Jy het jou doel bereik. Kom ons bevestig.';
            const togo = loanGoal.value - totalMaxLoan.value;
            return 'Nog ' + formatZAR(togo) + ' om jou doel te haal';
          });

          const ctaLabel = computed(() => {
            if (assets.value.length === 0) return 'Voeg minstens een bate by';
            if (goalReached.value) return 'Ek is reg — wys my my lening →';
            return 'Wys my my lening →';
          });

          const annualInterestRatePct = computed(() =>
            (annualInterestRate.value * 100).toFixed(1).replace(/\.0$/, '')
          );

          const progressBarColor = computed(() => {
            const pct = progressPct.value;
            if (pct >= 80) return 'var(--color-success)';
            if (pct >= 50) return 'var(--color-warning)';
            return 'var(--color-danger)';
          });

          const displayPaymentLabel = computed(() => {
            if (paymentFrequency.value === 'biannual') return 'Per halfjaar';
            if (paymentFrequency.value === 'annual')   return 'Per jaar';
            return 'Per maand';
          });

          const displayPayment = computed(() => {
            const mp = aggregate.value.monthly_payment;
            if (paymentFrequency.value === 'biannual') return mp * 6;
            if (paymentFrequency.value === 'annual')   return mp * 12;
            return mp;
          });

          const finalDisplayPayment = computed(() => {
            if (!finalResult.value) return 0;
            const mp = finalResult.value.monthly_payment;
            if (paymentFrequency.value === 'biannual') return mp * 6;
            if (paymentFrequency.value === 'annual')   return mp * 12;
            return mp;
          });

          const stepFormValid = computed(() =>
            isValidName(leadFirstName.value)
            && isValidName(leadLastName.value)
            && isValidPhone(leadPhone.value)
            && isValidEmail(leadEmail.value)
            && (applicantType.value === 'individu' ||
                (isValidName(companyName.value) && companyReg.value.trim().length >= 4))
          );

          const leadFormValid = computed(() =>
            isValidName(leadFirstName.value)
            && isValidName(leadLastName.value)
            && isValidPhone(leadPhone.value)
            && isValidEmail(leadEmail.value)
          );

          // ==================== LOOKUP HELPERS ====================
          function getCategory(id)  { return CATEGORIES.find(c => c.id === id) || {}; }
          function getAge(id)       { return AGE_BRACKETS.find(a => a.id === id) || {}; }
          function getCondition(id) { return CONDITIONS.find(c => c.id === id) || {}; }

          function getAssetContribution(asset) {
            const collateral = calcCollateral(asset);
            const ltv = LTV_TABLE[creditRecord.value] ?? 0.40;
            return collateral * ltv;
          }

          // ==================== VALIDATORS ====================
          function isValidName(v)  { return typeof v === 'string' && v.trim().length >= 2; }
          function isValidPhone(v) {
            if (!v) return false;
            const cleaned = v.replace(/[\s\-()]/g, '');
            return /^(0[6-8]\d{8}|\+27[6-8]\d{8})$/.test(cleaned);
          }
          function isValidEmail(v) {
            return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
          }
          function validateLeadField(field) {
            const errs = { ...leadErrors.value };
            if (field === 'firstName') errs.firstName = isValidName(leadFirstName.value) ? '' : 'Voer asseblief jou naam in';
            if (field === 'lastName')  errs.lastName  = isValidName(leadLastName.value)  ? '' : 'Voer asseblief jou van in';
            if (field === 'phone')     errs.phone     = isValidPhone(leadPhone.value)     ? '' : 'Gebruik \'n geldige SA selfoonnommer';
            if (field === 'email')     errs.email     = isValidEmail(leadEmail.value)     ? '' : 'Voer \'n geldige e-pos adres in';
            if (field === 'companyName') errs.companyName = isValidName(companyName.value) ? '' : 'Voer maatskappynaam in';
            if (field === 'companyReg')  errs.companyReg  = companyReg.value.trim().length >= 4 ? '' : 'Voer registrasienommer in';
            leadErrors.value = errs;
          }

          // ==================== INPUT HANDLERS ====================

          // Step 1 input (loan amount)
          function handleInput(e) {
            const el = e.target;
            const oldCursor = el.selectionStart ?? el.value.length;
            const digitsBeforeCursor = el.value.substring(0, oldCursor).replace(/\D/g, '').length;

            const rawDigits = el.value.replace(/\D/g, '');

            if (rawDigits === '') {
              desiredAmount.value = null;
              displayAmount.value = '';
              return;
            }

            const numeric = parseInt(rawDigits, 10);
            desiredAmount.value = numeric;

            const formatted = numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            displayAmount.value = formatted;

            requestAnimationFrame(() => {
              if (document.activeElement !== el) return;
              let newCursor = 0;
              let count = 0;
              for (let i = 0; i < formatted.length; i++) {
                if (count >= digitsBeforeCursor) break;
                if (/\d/.test(formatted[i])) count++;
                newCursor = i + 1;
              }
              try { el.setSelectionRange(newCursor, newCursor); } catch (_) {}
            });
          }

          // Step 2 input (asset market value)
          function handleValueInput(e) {
            const el = e.target;
            const oldCursor = el.selectionStart ?? el.value.length;
            const digitsBeforeCursor = el.value.substring(0, oldCursor).replace(/\D/g, '').length;

            const rawDigits = el.value.replace(/\D/g, '');
            if (rawDigits === '') {
              draftValue.value = null;
              draftValueDisplay.value = '';
              return;
            }
            const numeric = parseInt(rawDigits, 10);
            draftValue.value = numeric;
            const formatted = numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            draftValueDisplay.value = formatted;

            requestAnimationFrame(() => {
              if (document.activeElement !== el) return;
              let newCursor = 0, count = 0;
              for (let i = 0; i < formatted.length; i++) {
                if (count >= digitsBeforeCursor) break;
                if (/\d/.test(formatted[i])) count++;
                newCursor = i + 1;
              }
              try { el.setSelectionRange(newCursor, newCursor); } catch (_) {}
            });
          }

          // Step 2 input (interest rate)
          function handleRateInput(e) {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0 && v <= 40) {
              annualInterestRate.value = v / 100;
            }
          }

          // ==================== STEP TRANSITION ====================
          function goToStep2() {
            loanGoal.value = desiredAmount.value;
            currentStep.value = 2;
          }

          function scrollToAddCard() {
            const el = document.querySelector('.add-card');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // ==================== ASSET CRUD ====================
          function addAsset() {
            if (!draftIsValid.value) return;

            assets.value.push({
              id: nextAssetId++,
              category_id: draftCategory.value,
              market_value: draftValue.value,
              age_id: draftAge.value,
              condition_id: draftCondition.value,
            });

            draftCategory.value = null;
            draftValue.value = null;
            draftValueDisplay.value = '';
            draftAge.value = null;
            draftCondition.value = null;

            addFlash.value = true;
            setTimeout(() => { addFlash.value = false; }, 600);
          }

          function removeAsset(id) {
            assets.value = assets.value.filter(a => a.id !== id);
          }

          // ==================== LEAD FORM ====================
          function openLeadForm() {
            if (assets.value.length === 0) return;
            leadFormOpen.value = true;
            nextTick(() => {
              const el = document.getElementById('lead-first-name');
              if (el) el.focus();
            });
          }

          function closeLeadForm() {
            leadFormOpen.value = false;
          }

          async function submitLead() {
            validateLeadField('firstName');
            validateLeadField('lastName');
            validateLeadField('phone');
            validateLeadField('email');
            if (!leadFormValid.value) return;

            leadSubmitting.value = true;

            // Normalize SA phone to E.164 so WhatsApp can deliver (0XXXXXXXXX -> +27XXXXXXXXX)
            const rawPhone = leadPhone.value.trim().replace(/\s+/g, '');
            const phoneE164 = rawPhone.startsWith('+')
              ? rawPhone
              : rawPhone.startsWith('0')
                ? '+27' + rawPhone.slice(1)
                : '+' + rawPhone;

            // Compose full name from the two captured fields
            const firstName = leadFirstName.value.trim().replace(/\s+/g, ' ');
            const lastName  = leadLastName.value.trim().replace(/\s+/g, ' ');
            const fullName  = (firstName + ' ' + lastName).trim();

            const assetsList = assets.value.map(a => ({
              category: a.category_id,
              market_value: a.market_value,
              age_years: getAge(a.age_id).years,
              condition: a.condition_id,
              collateral_value: Math.round(calcCollateral(a)),
            }));

            // Goal maths for agent scripting
            const goalDelta    = aggregate.value.max_loan - loanGoal.value;
            const loanShortfall = goalDelta < 0 ? Math.abs(goalDelta) : 0;
            const loanSurplus   = goalDelta > 0 ? goalDelta : 0;
            const progressPctRounded = Math.round(progressPct.value);

            // Simple lead score for CRM routing / priority
            //   hot  = reached goal AND good credit
            //   warm = reached goal OR (>= 70% of goal AND credit not weak)
            //   cold = everything else
            let leadScore = 'cold';
            if (goalReached.value && creditRecord.value === 'good') {
              leadScore = 'hot';
            } else if (
              goalReached.value ||
              (progressPctRounded >= 70 && creditRecord.value !== 'weak')
            ) {
              leadScore = 'warm';
            }

            // Attribution: UTMs
            const urlParams   = new URLSearchParams(window.location.search);
            const utmSource   = urlParams.get('utm_source')   || '';
            const utmMedium   = urlParams.get('utm_medium')   || '';
            const utmCampaign = urlParams.get('utm_campaign') || '';

            // Device heuristic
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const device   = isMobile ? 'mobile' : 'desktop';

            // Unique CRM contact id (UUID v4 where available, fallback otherwise).
            // Maps to UChat's native "CRM Contact Id" identity field ($.crm_contact_id)
            // so returning submissions can match the same bot user.
            const crmContactId = (window.crypto && crypto.randomUUID)
              ? crypto.randomUUID()
              : 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);

            // Short, human-shareable reference (used by the WhatsApp bot too)
            const reference = 'BSK-' + Date.now().toString(36).slice(-6).toUpperCase();
            referenceId.value = reference;

            const payload = {
              // --- Tier 1: Bank / PDF fields ---
              reference_id: reference,
              submitted_at: new Date().toISOString(),

              name: fullName,
              first_name: firstName,
              last_name: lastName,
              phone: phoneE164,
              email: leadEmail.value.trim(),
              applicant_type: applicantType.value,
              company_name: companyName.value.trim(),
              company_reg: companyReg.value.trim(),
              company_vat: companyVat.value.trim(),

              loan_goal: loanGoal.value,
              max_loan: aggregate.value.max_loan,
              loan_term_months: loanTermMonths.value,
              annual_interest_rate: annualInterestRate.value,
              credit_record: creditRecord.value,
              monthly_payment: aggregate.value.monthly_payment,
              total_repayment: aggregate.value.total_repayment,
              total_finance_cost: aggregate.value.total_finance_cost,
              total_collateral: aggregate.value.total_collateral,
              loan_shortfall: loanShortfall,
              loan_surplus: loanSurplus,
              goal_reached: goalReached.value,
              progress_pct: progressPctRounded,

              assets: assetsList,

              // --- Tier 2: Internal / uChat routing ---
              crm_contact_id: crmContactId,
              whatsapp_to: phoneE164,
              lead_score: leadScore,
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              device: device,
            };

            finalResult.value = aggregate.value;
            submitState.value = 'submitting';
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Generate PDF first so pdf_url can be included in the CRM payload.
            pdfUrl.value = null;
            let generatedPdfUrl = null;
            try {
              const pdfResp = await fetch(PDF_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PDF_SECRET}` },
                body: JSON.stringify(payload),
              });
              if (pdfResp.ok) {
                const pdfJson = await pdfResp.json();
                if (pdfJson && pdfJson.pdf_url) {
                  generatedPdfUrl = pdfJson.pdf_url;
                  pdfUrl.value = generatedPdfUrl;
                }
              }
            } catch (err) {
              console.warn('[Boerseker] PDF generation failed:', err);
            }

            // Send CRM with pdf_url included so Boerseker can view and print.
            const crmPayload = generatedPdfUrl ? { ...payload, pdf_url: generatedPdfUrl } : payload;
            let crmOk = false;
            try {
              const resp = await fetch(CRM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(crmPayload),
              });
              crmOk = resp.ok;
              if (!resp.ok) console.warn('[Boerseker] CRM responded', resp.status);
            } catch (err) {
              console.warn('[Boerseker] CRM POST failed:', err);
            }

            if (!crmOk) {
              leadSubmitting.value = false;
              submitState.value = 'error';
              submitError.value = 'Ons kon nie nou jou aansoek stuur nie. WhatsApp Boerseker direk — ons het jou inligting nog by die hand.';
              return;
            }

            // Show the Johan handoff bubble for ~2.4s, then the final screen.
            submitState.value = 'handoff';
            await new Promise((r) => setTimeout(r, 2400));

            leadSubmitting.value = false;
            leadFormOpen.value = false;
            submitState.value = 'idle';
            showFinalResult.value = true;
            try { localStorage.removeItem('boerseker_draft_v1'); } catch (_) {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          // Clear company fields when switching back to Individu so stale data
          // doesn't leak into the CRM payload.
          watch(applicantType, (v) => {
            if (v === 'individu') {
              companyName.value = '';
              companyReg.value  = '';
              companyVat.value  = '';
            }
          });

          // ==================== WATCHERS ====================

          // Step 2: animated counter
          let counterRaf = null;
          watch(totalMaxLoan, (newVal) => {
            if (counterRaf) cancelAnimationFrame(counterRaf);
            const start = animatedMaxLoan.value;
            const delta = newVal - start;
            const duration = 500;
            const startTime = performance.now();
            function tick(now) {
              const elapsed = now - startTime;
              const t = Math.min(1, elapsed / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              animatedMaxLoan.value = Math.round(start + delta * eased);
              if (t < 1) {
                counterRaf = requestAnimationFrame(tick);
              } else {
                animatedMaxLoan.value = newVal;
                counterRaf = null;
              }
            }
            counterRaf = requestAnimationFrame(tick);
          });

          // ==================== ON MOUNT ====================
          onMounted(() => {
            // Deep-link support: ?loan=500000 skips to Step 2
            const params = new URLSearchParams(window.location.search);
            const loanParam = params.get('loan');
            if (loanParam) {
              const parsed = parseInt(loanParam, 10);
              if (!isNaN(parsed) && parsed >= MIN_AMOUNT && parsed <= MAX_AMOUNT) {
                desiredAmount.value = parsed;
                displayAmount.value = parsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                loanGoal.value = parsed;
                currentStep.value = 2;
              }
            }

            // Escape closes lead modal
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape' && leadFormOpen.value) closeLeadForm();
            });

            // ----- Silent draft restore (so a refresh doesn't wipe progress) -----
            try {
              const raw = localStorage.getItem('boerseker_draft_v1');
              if (raw) {
                const d = JSON.parse(raw);
                if (Array.isArray(d.assets) && d.assets.length) {
                  assets.value = d.assets;
                  nextAssetId = d.assets.reduce((m, a) => Math.max(m, a.id || 0), 0) + 1;
                }
                if (typeof d.loanGoal === 'number')          loanGoal.value = d.loanGoal;
                if (typeof d.creditRecord === 'string')      creditRecord.value = d.creditRecord;
                if (typeof d.loanTermMonths === 'number')    loanTermMonths.value = d.loanTermMonths;
                if (typeof d.annualInterestRate === 'number') annualInterestRate.value = d.annualInterestRate;
                if (typeof d.paymentFrequency === 'string')  paymentFrequency.value = d.paymentFrequency;
                if (typeof d.applicantType === 'string')     applicantType.value = d.applicantType;
                if (typeof d.companyName === 'string')       companyName.value = d.companyName;
                if (typeof d.companyReg === 'string')        companyReg.value = d.companyReg;
                if (typeof d.companyVat === 'string')        companyVat.value = d.companyVat;
                if (typeof d.leadFirstName === 'string')     leadFirstName.value = d.leadFirstName;
                if (typeof d.leadLastName === 'string')      leadLastName.value = d.leadLastName;
                if (typeof d.leadPhone === 'string')         leadPhone.value = d.leadPhone;
                if (typeof d.leadEmail === 'string')         leadEmail.value = d.leadEmail;
              }
            } catch (_) { /* ignore — draft restore is best-effort */ }

            // Persist draft on any meaningful change. Debounced via raf.
            let saveQueued = false;
            function saveDraft() {
              if (saveQueued) return;
              saveQueued = true;
              requestAnimationFrame(() => {
                saveQueued = false;
                try {
                  localStorage.setItem('boerseker_draft_v1', JSON.stringify({
                    assets: assets.value,
                    loanGoal: loanGoal.value,
                    creditRecord: creditRecord.value,
                    loanTermMonths: loanTermMonths.value,
                    annualInterestRate: annualInterestRate.value,
                    paymentFrequency: paymentFrequency.value,
                    applicantType: applicantType.value,
                    companyName: companyName.value,
                    companyReg: companyReg.value,
                    companyVat: companyVat.value,
                    leadFirstName: leadFirstName.value,
                    leadLastName: leadLastName.value,
                    leadPhone: leadPhone.value,
                    leadEmail: leadEmail.value,
                  }));
                } catch (_) {}
              });
            }
            watch([
              assets, loanGoal, creditRecord, loanTermMonths, annualInterestRate, paymentFrequency,
              applicantType, companyName, companyReg, companyVat,
              leadFirstName, leadLastName, leadPhone, leadEmail,
            ], saveDraft, { deep: true });
          });

          // ==================== RETURN ====================
          return {
            // Shared
            currentStep,

            // Wizard
            WIZARD_STEPS, wizardStep, goToWizardStep, nextWizardStep, prevWizardStep,
            rateOpen, submitState, submitError, referenceId,
            BUSINESS_WHATSAPP, BUSINESS_PHONE, BUSINESS_NAME,

            // Constants
            CATEGORIES, AGE_BRACKETS, CONDITIONS, CREDIT_OPTIONS, TERM_OPTIONS,

            // Step 1
            displayAmount, isValid,
            formattedLower, formattedUpper, formattedAmount,
            helperText, helperIsError,

            // Step 2
            loanGoal,
            draftCategory, draftValue, draftValueDisplay, draftAge, draftCondition,
            assets,
            creditRecord, loanTermMonths, annualInterestRate, annualInterestRatePct,
            paymentFrequency,
            leadFormOpen, leadFirstName, leadLastName, leadPhone, leadEmail, leadErrors, leadSubmitting,
            applicantType, companyName, companyReg, companyVat, stepFormValid,
            showFinalResult, finalResult, pdfUrl,
            addFlash, animatedMaxLoan,

            // Computeds
            draftIsValid, totalMaxLoan, aggregate,
            progressPct, progressPctLabel, progressFillWidth,
            progressBarColor, displayPayment, displayPaymentLabel, finalDisplayPayment,
            goalReached, progressMessage, ctaLabel,
            leadFormValid,

            // Methods
            formatZAR,
            getCategory, getAge, getCondition, getAssetContribution,
            handleInput, handleValueInput, handleRateInput,
            goToStep2, scrollToAddCard,
            addAsset, removeAsset,
            openLeadForm, closeLeadForm, submitLead,
            validateLeadField,
          };
        }
      }).mount('#boerseker-app');
    
    /* === END extracted app logic === */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
