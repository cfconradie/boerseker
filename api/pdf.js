const React = require('react');
const { Document, Page, Text, View, StyleSheet, pdf, Image } = require('@react-pdf/renderer');
const { put } = require('@vercel/blob');
const fs   = require('fs');
const path = require('path');

// ── Logo assets (base64 at module load) ───────────────────────────────────────

const LOGO_DARK_B64 = 'data:image/png;base64,' +
  fs.readFileSync(path.join(__dirname, '../branding/Logo Exports/Full logo Dark.png')).toString('base64');

const LOGO_ICON_B64 = 'data:image/png;base64,' +
  fs.readFileSync(path.join(__dirname, '../branding/Logo Exports/Icon Dark.png')).toString('base64');

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return 'R ' + parseInt(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const condMap   = { good: 'Goed', fair: 'Redelik', poor: 'Swak' };
const creditMap = { good: 'Uitstekend', medium: 'Goed', weak: 'Swak' };

// ── Styles ────────────────────────────────────────────────────────────────────

const GREEN = '#0B2721';
const DARK  = '#1a1a1a';

const S = StyleSheet.create({
  page:        { backgroundColor: '#fff', fontFamily: 'Times-Roman', fontSize: 10, color: DARK, paddingBottom: 0 },
  bar:         { height: 6, backgroundColor: DARK },
  hdr:         { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 40, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  logoHdr:     { width: 160, height: 34 },
  body:        { flex: 1, paddingHorizontal: 40, paddingTop: 14 },
  toLbl:       { fontSize: 7, fontFamily: 'Helvetica', letterSpacing: 1, color: '#999', marginBottom: 3 },
  toName:      { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  toSub:       { fontSize: 8, fontFamily: 'Helvetica', color: '#666', marginTop: 2 },
  meta:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  metaTitle:   { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  metaSub:     { fontSize: 8, fontFamily: 'Helvetica', color: '#666', marginTop: 2 },
  metaR:       { fontSize: 8, fontFamily: 'Helvetica', color: '#666', textAlign: 'right' },
  metaRBold:   { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  sec:         { marginBottom: 12 },
  secLbl:      { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: GREEN, borderBottomWidth: 1.5, borderBottomColor: GREEN, paddingBottom: 2, marginBottom: 8 },
  detRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f2f2f2', paddingVertical: 4 },
  detKey:      { width: 160, fontSize: 9, fontFamily: 'Helvetica', color: '#666' },
  detVal:      { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tblHead:     { flexDirection: 'row', backgroundColor: DARK, paddingVertical: 6, paddingHorizontal: 8 },
  tblHeadCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff', letterSpacing: 0.5 },
  tblRow:      { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8 },
  tblRowAlt:   { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#f4f6f5' },
  tblFoot:     { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#e8ede9', borderTopWidth: 2, borderTopColor: GREEN },
  tblCell:     { fontSize: 9, fontFamily: 'Helvetica' },
  tblCellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  badgeRow:    { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 8 },
  badgeHot:    { paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 2 },
  badgeWarm:   { paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 2 },
  badgeCold:   { paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#fce4ec', borderWidth: 1, borderColor: '#ef9a9a', borderRadius: 2 },
  badgeYes:    { paddingHorizontal: 9, paddingVertical: 3, backgroundColor: DARK, borderRadius: 2 },
  badgeNo:     { paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#777', borderRadius: 2 },
  badgeTxtHot:  { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: '#2e7d32' },
  badgeTxtWarm: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: '#b45309' },
  badgeTxtCold: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: '#c62828' },
  badgeTxtInv:  { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, color: '#fff' },
  notePos:     { marginTop: 7, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#e8f5e9', borderRadius: 2, fontSize: 8, fontFamily: 'Helvetica', color: '#2e7d32' },
  noteNeg:     { marginTop: 7, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#fce4ec', borderRadius: 2, fontSize: 8, fontFamily: 'Helvetica', color: '#c62828' },
  ftr:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 40, paddingTop: 16, paddingBottom: 10 },
  sigName:     { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  sigTitle:    { fontSize: 8, fontFamily: 'Helvetica', color: '#666', marginTop: 2 },
  logoMark:    { width: 36, height: 36 },
  disc:        { paddingHorizontal: 40, paddingBottom: 10, fontSize: 6.5, fontFamily: 'Helvetica', color: '#aaa', lineHeight: 1.5 },
});

// ── Column widths for asset table ─────────────────────────────────────────────
const COL = { cat: '22%', mkt: '20%', age: '12%', cond: '16%', col: '30%' };

// ── PDF Document ──────────────────────────────────────────────────────────────

function buildDoc(d) {
  const assets        = Array.isArray(d.assets) ? d.assets : JSON.parse(d.assets || '[]');
  const applicantType = d.applicant_type || 'individu';
  const companyName   = d.company_name || '';
  const companyReg    = d.company_reg  || '';
  const companyVat    = d.company_vat  || '';
  const leadScore     = d.lead_score   || 'cold';
  const goalReached   = d.goal_reached === true || d.goal_reached === 'true';
  const progressPct   = parseInt(d.progress_pct) || 0;
  const loanSurplus   = parseFloat(d.loan_surplus)   || 0;
  const loanShortfall = parseFloat(d.loan_shortfall) || 0;
  const rate          = (parseFloat(d.annual_interest_rate || 0) * 100).toFixed(0);
  const creditLabel   = creditMap[d.credit_record] || d.credit_record || '';
  const typeLabel     = applicantType === 'besigheid' ? 'Besigheid' : 'Individu';

  const dt      = new Date(d.submitted_at || Date.now());
  const dateStr = dt.getDate().toString().padStart(2, '0') + '/' +
                  (dt.getMonth() + 1).toString().padStart(2, '0') + '/' +
                  dt.getFullYear();

  const badgeStyle = leadScore === 'hot' ? S.badgeHot : leadScore === 'warm' ? S.badgeWarm : S.badgeCold;
  const badgeTxt   = leadScore === 'hot' ? S.badgeTxtHot : leadScore === 'warm' ? S.badgeTxtWarm : S.badgeTxtCold;
  const badgeLabel = leadScore === 'hot'  ? 'STERK KANDIDAAT'   :
                     leadScore === 'warm' ? 'GOEIE KANDIDAAT'   : 'VERDERE BESPREKING';

  const e = React.createElement;

  return e(Document, null,
    e(Page, { size: 'A4', style: S.page },

      // Top bar
      e(View, { style: S.bar }),

      // Header — logo
      e(View, { style: S.hdr },
        e(Image, { style: S.logoHdr, src: LOGO_DARK_B64 })
      ),

      // Body
      e(View, { style: S.body },

        // To block
        e(Text, { style: S.toLbl }, 'AAN.'),
        e(Text, { style: S.toName }, `${d.first_name} ${d.last_name}`),
        e(Text, { style: S.toSub }, `${typeLabel}${companyName ? ' — ' + companyName : ''}`),

        // Meta row
        e(View, { style: S.meta },
          e(View, null,
            e(Text, { style: S.metaTitle }, 'Finansieringsverslag'),
            e(Text, { style: S.metaSub }, 'Boerseker Landboufinansiering'),
          ),
          e(View, null,
            e(Text, { style: S.metaR }, `Verwysing: `),
            e(Text, { style: S.metaRBold }, d.reference_id),
            e(Text, { style: S.metaR }, `Datum: ${dateStr}`),
          )
        ),

        // ── Aansoekbesonderhede ──
        e(View, { style: S.sec },
          e(Text, { style: S.secLbl }, 'Aansoekbesonderhede'),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Naam'),        e(Text, { style: S.detVal }, `${d.first_name} ${d.last_name}`)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Telefoon'),    e(Text, { style: S.detVal }, d.phone)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'E-pos'),       e(Text, { style: S.detVal }, d.email)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Aansoektype'), e(Text, { style: S.detVal }, typeLabel)),
          ...(applicantType === 'besigheid' ? [
            e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Besigheidsnaam'),    e(Text, { style: S.detVal }, companyName)),
            e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Registrasienommer'), e(Text, { style: S.detVal }, companyReg)),
            ...(companyVat ? [e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'BTW-nommer'), e(Text, { style: S.detVal }, companyVat))] : []),
          ] : []),
        ),

        // ── Bate-skedule ──
        e(View, { style: S.sec },
          e(Text, { style: S.secLbl }, 'Bate-skedule'),
          e(View, { style: S.tblHead },
            e(Text, { style: [S.tblHeadCell, { width: COL.cat }] }, 'Bate'),
            e(Text, { style: [S.tblHeadCell, { width: COL.mkt }] }, 'Markwaarde'),
            e(Text, { style: [S.tblHeadCell, { width: COL.age }] }, 'Ouderdom'),
            e(Text, { style: [S.tblHeadCell, { width: COL.cond }] }, 'Toestand'),
            e(Text, { style: [S.tblHeadCell, { width: COL.col }] }, 'Kollaterale Waarde'),
          ),
          ...assets.map((a, i) =>
            e(View, { key: i, style: i % 2 === 1 ? S.tblRowAlt : S.tblRow },
              e(Text, { style: [S.tblCell, { width: COL.cat }] }, a.category.charAt(0).toUpperCase() + a.category.slice(1)),
              e(Text, { style: [S.tblCell, { width: COL.mkt }] }, fmt(a.market_value)),
              e(Text, { style: [S.tblCell, { width: COL.age }] }, `${a.age_years} jr`),
              e(Text, { style: [S.tblCell, { width: COL.cond }] }, condMap[a.condition] || a.condition),
              e(Text, { style: [S.tblCell, { width: COL.col }] }, fmt(a.collateral_value)),
            )
          ),
          e(View, { style: S.tblFoot },
            e(Text, { style: [S.tblCellBold, { width: '70%' }] }, 'Totale Kollaterale Waarde'),
            e(Text, { style: [S.tblCellBold, { width: '30%' }] }, fmt(d.total_collateral)),
          ),
        ),

        // ── Leningsopsomming ──
        e(View, { style: S.sec },
          e(Text, { style: S.secLbl }, 'Leningsopsomming'),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Leningsdoelwit'),          e(Text, { style: S.detVal }, fmt(d.loan_goal))),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Maksimum Lening'),         e(Text, { style: S.detVal }, fmt(d.max_loan))),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Termyn'),                  e(Text, { style: S.detVal }, `${d.loan_term_months} maande`)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Rentekoers (per jaar)'),   e(Text, { style: S.detVal }, `${rate}%`)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Krediettelling'),          e(Text, { style: S.detVal }, creditLabel)),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Maandelikse Paaiement'),   e(Text, { style: S.detVal }, fmt(d.monthly_payment))),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Totale Terugbetaling'),    e(Text, { style: S.detVal }, fmt(d.total_repayment))),
          e(View, { style: S.detRow }, e(Text, { style: S.detKey }, 'Totale Finansieringskoste'), e(Text, { style: S.detVal }, fmt(d.total_finance_cost))),
        ),

        // ── Kwalifikasie-status ──
        e(View, { style: S.sec },
          e(Text, { style: S.secLbl }, 'Kwalifikasie-status'),
          e(View, { style: S.badgeRow },
            e(View, { style: badgeStyle },
              e(Text, { style: badgeTxt }, badgeLabel),
            ),
            e(View, { style: goalReached ? S.badgeYes : S.badgeNo },
              e(Text, { style: S.badgeTxtInv }, `${goalReached ? 'LENINGSDOELWIT BEREIK' : 'DOELWIT NIE BEREIK'} (${progressPct}%)`),
            ),
          ),
          goalReached
            ? (loanSurplus > 0
                ? e(Text, { style: S.notePos }, `Jou bates ondersteun ${fmt(loanSurplus)} meer as jou leningsdoelwit.`)
                : null)
            : e(Text, { style: S.noteNeg }, `Jou bates skort ${fmt(loanShortfall)} om jou leningsdoelwit te bereik.`),
        ),
      ),

      // Footer
      e(View, { style: S.ftr },
        e(View, null,
          e(Text, { style: S.sigName }, 'Manie du Plessis'),
          e(Text, { style: S.sigTitle }, 'CEO, Boerseker (Pty) Ltd'),
        ),
        e(Image, { style: S.logoMark, src: LOGO_ICON_B64 }),
      ),

      // Disclaimer
      e(Text, { style: S.disc },
        "Hierdie verslag is 'n indikatiewe beraming gebaseer op die inligting verskaf en dien as 'n riglyn vir bankfinansieringsgesprekke. " +
        "Dit is nie 'n formele leningsaanbod nie. Alle lenings is onderhewig aan kredietgoedkeuring en regulatoriese vereistes. " +
        "Boerseker (Pty) Ltd | NCR Registrasienommer: NCRCP XXXX | www.boerseker.co.za"
      ),

      // Bottom bar
      e(View, { style: S.bar }),
    )
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.PDF_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = req.body;
  if (!data || !data.reference_id) {
    return res.status(400).json({ error: 'Missing reference_id in body' });
  }

  try {
    const doc    = buildDoc(data);
    const stream = await pdf(doc).toBuffer();

    const filename = `verslag-${data.reference_id}.pdf`;
    const { url } = await put(filename, stream, {
      access:      'public',
      contentType: 'application/pdf',
    });

    return res.status(200).json({ pdf_url: url });

  } catch (err) {
    console.error('[pdf]', err);
    return res.status(500).json({ error: err.message });
  }
};
