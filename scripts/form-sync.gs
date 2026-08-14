/**
 * MPL — push each Google Form submission straight into Supabase.
 *
 * Setup (once):
 *  1. Open the responses Sheet → Extensions → Apps Script, paste this file.
 *  2. Project Settings → Script Properties, add:
 *       SUPABASE_URL = https://<your-project>.supabase.co
 *       SUPABASE_SERVICE_KEY = <your service key>   ← rotate first, never commit it
 *  3. Triggers → Add trigger → onFormSubmit → From spreadsheet → On form submit.
 *  4. Run backfillExistingPhotos() once, to publish photos already submitted.
 *
 * The service key is safe here and only here: Apps Script runs on Google's
 * servers, never in a browser. It must never reach the app or this repo.
 *
 * ponytail: reads e.values by index, so DO NOT reorder the form questions.
 * Order: 0 timestamp, 1 photo, 2 name, 3 age, 4 all-rounder, 5 batting,
 *        6 bowling, 7 contact, 8 available.
 */
function onFormSubmit(e) {
  var v = e.values;
  if (!/^yes/i.test(v[8] || '')) return;          // not available for MPL — skip
  if (!v[2] || !v[2].trim()) return;              // no name — nothing to store

  var photo = /id=([\w-]+)/.exec(v[1] || '');
  if (photo) publishPhoto(photo[1]);
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Script Properties.');

  var row = {
    name: v[2].trim(),
    age: parseInt(v[3], 10) || null,
    all_rounder: /^yes/i.test(v[4] || ''),
    batting: v[5] || null,
    bowling: v[6] || null,
    photo_id: photo ? photo[1] : null,
    form_ts: toIso(v[0]),
  };

  var res = UrlFetchApp.fetch(url + '/rest/v1/player_pool', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      Prefer: 'resolution=ignore-duplicates',     // re-runs can't create duplicates
    },
    payload: JSON.stringify(row),
    muteHttpExceptions: true,
  });

  // Let it throw: a failed sync must show up in the Apps Script execution log,
  // not vanish and leave a player missing on auction day.
  if (res.getResponseCode() >= 300) {
    throw new Error('Supabase ' + res.getResponseCode() + ': ' + res.getContentText());
  }
}

/** Sheet timestamps are dd/MM/yyyy HH:mm:ss; Date() misreads those as US order. */
function toIso(ts) {
  var m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/.exec(ts || '');
  if (!m) return null;
  return m[3] + '-' + m[2] + '-' + m[1] + 'T' + m[4] + ':' + m[5] + ':' + m[6];
}


/**
 * Form uploads land in Drive private to the form owner, so the app gets a
 * sign-in page instead of a face. This grants link-read on the one file.
 *
 * Note this genuinely makes the photo public to anyone holding the URL —
 * unavoidable when a browser renders it directly, and the URL contains an
 * unguessable file id.
 */
function publishPhoto(fileId) {
  try {
    DriveApp.getFileById(fileId)
      .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // A photo that will not publish must not lose the whole registration.
    console.error('could not publish photo ' + fileId + ': ' + err);
  }
}

/** One-off: publish every photo already sitting in the responses sheet. */
function backfillExistingPhotos() {
  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getDataRange().getValues();
  var done = 0;
  for (var i = 1; i < rows.length; i++) {
    var m = /id=([\w-]+)/.exec(String(rows[i][1] || ''));
    if (m) { publishPhoto(m[1]); done++; }
  }
  console.log('published ' + done + ' photos');
}
