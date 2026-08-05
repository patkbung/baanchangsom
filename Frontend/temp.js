
    // ── LIFF Profile ──
    const LIFF_ID = '2010947166-BLk9wNiz';
    (async () => {
      try {
        if (LIFF_ID) {
          await liff.init({ liffId: LIFF_ID });
          if (liff.isLoggedIn()) {
            const p = await liff.getProfile();
            window.lineDisplayName = p.displayName;
            if (typeof window.handlePeopleChange === 'function') window.handlePeopleChange();
            document.getElementById('user-name').textContent = p.displayName;
            const img = document.getElementById('user-avatar');
            img.src = p.pictureUrl;
            img.style.display = 'block';
            document.getElementById('user-avatar-fallback').style.display = 'none';
            const token = liff.getAccessToken();
            
            // Print debug info
            const debugEl = document.getElementById('liff-debug');
            if (debugEl) {
              debugEl.textContent = `InClient: ${liff.isInClient()}, LoggedIn: ${liff.isLoggedIn()}, Token: ${token ? token.slice(0, 15) : 'none'}..., HasDots: ${token ? token.includes('.') : false}`;
              debugEl.style.display = 'block';
            }

            if (token) {
              await fetch(`${window.API_BASE_URL}/v1/auth/line/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: token })
              }).catch(err => console.error('Backend verify failed:', err));

              // Check admin status to update navbar
              const adminIdToken = liff.getAccessToken();
              fetch(`${window.API_BASE_URL}/v1/admin/auth/line`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: adminIdToken })
              })
              .then(res => {
                const dynamicLink = document.getElementById('nav-dynamic-item');
                const dynamicIcon = document.getElementById('nav-dynamic-icon');
                const dynamicText = document.getElementById('nav-dynamic-text');
                if (res.ok) {
                  if (dynamicLink) dynamicLink.href = 'admin.html';
                  if (dynamicIcon) dynamicIcon.textContent = 'calendar_month';
                  if (dynamicText) dynamicText.setAttribute('data-i18n', 'bnav-schedule');
                } else {
                  if (dynamicLink) dynamicLink.href = 'profile.html';
                  if (dynamicIcon) {
                    dynamicIcon.textContent = 'person';
                    dynamicIcon.style.fontVariationSettings = "'FILL' 1";
                  }
                  if (dynamicText) dynamicText.setAttribute('data-i18n', 'bnav-profile');
                }
                if (typeof window.applyLang === 'function') window.applyLang();
              })
              .catch(err => console.error('Admin check failed:', err));
            }

            // Phone input restrict to 10 digits and numbers only
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
              phoneInput.addEventListener('input', e => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              });
            }
          } else {
            const debugEl = document.getElementById('liff-debug');
            if (debugEl) {
              debugEl.textContent = `Not logged in. Redirecting...`;
              debugEl.style.display = 'block';
            }
            liff.login();
          }
        }
      } catch (e) {
        console.error('LIFF Error:', e);
        alert('LIFF Error: ' + e.message);
      }
    })();

    const TODAY = new Date();
    let current = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    let selDay = TODAY.getDate(), selMonth = TODAY.getMonth(), selYear = TODAY.getFullYear();

    const monthNames = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    };
    const dayNames = {
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
    };

    window.renderCal = function renderCal() {
      const yr = current.getFullYear(), mo = current.getMonth();
      const lang = localStorage.getItem('lang') || 'th';
      const displayYr = lang === 'th' ? yr + 543 : yr;
      document.getElementById('cal-month-label').textContent = `${monthNames[lang][mo]} ${displayYr}`;
      const grid = document.getElementById('cal-grid');
      grid.innerHTML = '';
      const firstDow = new Date(yr, mo, 1).getDay();
      const daysInMo = new Date(yr, mo + 1, 0).getDate();
      const prevDays = new Date(yr, mo, 0).getDate();

      // Prev month filler
      for (let i = firstDow - 1; i >= 0; i--) {
        const el = document.createElement('div');
        el.className = 'cal-day faded';
        el.textContent = prevDays - i;
        grid.appendChild(el);
      }

      // Current month
      for (let d = 1; d <= daysInMo; d++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        const dow = new Date(yr, mo, d).getDay();
        let cls = 'cal-day';
        if (dow === 0) cls += ' sun';
        if (dow === 6) cls += ' sat';
        const isToday = d === TODAY.getDate() && mo === TODAY.getMonth() && yr === TODAY.getFullYear();
        if (isToday) cls += ' today';
        if (d === selDay && mo === selMonth && yr === selYear) cls += ' selected';

        const isPast = new Date(yr, mo, d) < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
        const isSunday = dow === 0;
        if (isPast || isSunday) {
          cls += ' faded';
          btn.disabled = true;
        }

        btn.className = cls;
        btn.textContent = d;

        if (!isPast) {
          btn.addEventListener('click', async () => {
            document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            selDay = d; selMonth = mo; selYear = yr;
            const lang = localStorage.getItem('lang') || 'th';
            const displayYr = lang === 'th' ? yr + 543 : yr;
            const dayName = dayNames[lang][dow];
            const dateStr = `${dayName}, ${d} ${monthNames[lang][mo]} ${displayYr}`;
            const bookPrefix = lang === 'th' ? 'จองคิว — ' : 'Book — ';
            document.getElementById('modal-date-title').textContent = `${bookPrefix}${dateStr}`;
            openModal();
            await handlePeopleChange();
          });
        }
        grid.appendChild(btn);
      }

      // Next month filler
      const total = firstDow + daysInMo;
      const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
      for (let d = 1; d <= rem; d++) {
        const el = document.createElement('div');
        el.className = 'cal-day faded';
        el.textContent = d;
        grid.appendChild(el);
      }

      // Update modal title if a day is selected
      if (selDay && selMonth !== undefined && selYear !== undefined) {
        const dow = new Date(selYear, selMonth, selDay).getDay();
        const lang = localStorage.getItem('lang') || 'th';
        const dayName = dayNames[lang][dow];
        const selDisplayYr = lang === 'th' ? selYear + 543 : selYear;
        const dateStr = `${dayName}, ${selDay} ${monthNames[lang][selMonth]} ${selDisplayYr}`;
        const bookPrefix = lang === 'th' ? 'จองคิว — ' : 'Book — ';
        document.getElementById('modal-date-title').textContent = `${bookPrefix}${dateStr}`;
      }
    }

    document.getElementById('prev-month').addEventListener('click', () => {
      current.setMonth(current.getMonth() - 1);
      renderCal();
    });
    document.getElementById('next-month').addEventListener('click', () => {
      current.setMonth(current.getMonth() + 1);
      renderCal();
    });

    // Modal
    const modal = document.getElementById('modal');

    function openModal() {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    async function bookToday() {
      selDay = TODAY.getDate();
      selMonth = TODAY.getMonth();
      selYear = TODAY.getFullYear();
      current = new Date(selYear, selMonth, 1);
      renderCal();
      const lang = localStorage.getItem('lang') || 'th';
      const displayYr = lang === 'th' ? selYear + 543 : selYear;
      const dayName = dayNames[lang][TODAY.getDay()];
      const dateStr = `${dayName}, ${selDay} ${monthNames[lang][selMonth]} ${displayYr}`;
      const bookPrefix = lang === 'th' ? 'จองคิว — ' : 'Book — ';
      document.getElementById('modal-date-title').textContent = `${bookPrefix}${dateStr}`;
      openModal();
      await handlePeopleChange();
    }

    window.contactAdmin = async function contactAdmin() {
      const lang = localStorage.getItem('lang') || 'th';
      const msg = lang === 'th' ? 'ติดต่อแอดมิน เพื่อจองคิว/แก้ไขการจอง' : 'Contact admin to edit/book';
      if (!liff.isInClient()) {
        alert(msg);
        return;
      }
      try {
        await liff.sendMessages([{ type: 'text', text: msg }]);
        liff.closeWindow();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    document.getElementById('close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      const btn = document.getElementById('submit-btn');
      btn.disabled = false;
      btn.className = 'submit-btn';
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px; font-variation-settings:\'FILL\' 1;">check_circle</span> ยืนยันการจอง';
      document.getElementById('booking-form').reset();
    }

    document.getElementById('booking-form').addEventListener('submit', async e => {
      e.preventDefault();
      const nameInputs = document.querySelectorAll('.name-input');
      let allNamesValid = true;
      nameInputs.forEach(input => {
        if (!input.value.trim()) allNamesValid = false;
      });

      const phone = document.getElementById('phone').value.trim();
      if (!allNamesValid || !phone) return;

      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined spin" style="font-size:18px;">progress_activity</span> Processing…';

      try {
        const token = liff.getAccessToken();
        if (!token) {
          liff.login();
          throw new Error('LINE Login token is missing. Redirecting to login to refresh scopes...');
        }

        const monthStr = String(selMonth + 1).padStart(2, '0');
        const dayStr = String(selDay).padStart(2, '0');
        const dateIso = `${selYear}-${monthStr}-${dayStr}`;

        const selectedTimeRadio = document.querySelector('input[name="time"]:checked');
        if (!selectedTimeRadio) throw new Error('Please select a time slot');
        const startTime = selectedTimeRadio.value;
        const partySize = parseInt(document.getElementById('num-people').value, 10);
        const serviceRadio = document.querySelector('input[name="service"]:checked');
        const serviceVal = serviceRadio ? serviceRadio.value : 'consultation';
        const legalName = nameInputs[0].value.trim();
        const guestNames = Array.from(nameInputs).map((inp, idx) => `คนที่ ${idx + 1}: ${inp.value.trim()}`).join('\n');

        // Step 1: Accept Consent
        const consentRes = await fetch(`${window.API_BASE_URL}/v1/me/consents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type: 'booking', version: 'v1', accepted: true })
        });
        if (!consentRes.ok) {
          const errData = await consentRes.json().catch(() => ({}));
          throw new Error(errData.message || errData.error?.message || 'Failed to record booking consent');
        }

        // Step 2: Update Profile
        const profileRes = await fetch(`${window.API_BASE_URL}/v1/me/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ legalName, phone })
        });
        if (!profileRes.ok) {
          const errData = await profileRes.json().catch(() => ({}));
          throw new Error(errData.message || errData.error?.message || 'Failed to update user profile');
        }

        // Step 3: Create Appointment
        const apptRes = await fetch(`${window.API_BASE_URL}/v1/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date: dateIso,
            startTime: startTime,
            partySize: partySize,
            notes: `บริการ: ${serviceVal}\nผู้จอง: ${legalName}\nเบอร์โทร: ${phone}\n${guestNames}`
          })
        });

        if (!apptRes.ok) {
          const errData = await apptRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create booking');
        }

        const currentLang = localStorage.getItem('lang') || 'th';
        alert(currentLang === 'en' ? 'Booking confirmed successfully!' : 'ยืนยันการจองคิวของคุณเรียบร้อยแล้ว!');
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px; font-variation-settings:\'FILL\' 1;">check_circle</span> ${currentLang === 'en' ? 'Confirmed!' : 'ยืนยันสำเร็จ!'}`;
        btn.classList.add('success');
        setTimeout(closeModal, 1000);
      } catch (err) {
        console.error('Booking Error:', err);
        alert('Booking Failed: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px; font-variation-settings:\'FILL\' 1;">check_circle</span> ยืนยันการจอง';
      }
    });

    window.updateStepper = async function (delta) {
      const input = document.getElementById('num-people');
      let val = parseInt(input.value, 10);
      val += delta;
      if (val < 1) val = 1;
      if (val > 8) val = 8;
      input.value = val;
      document.getElementById('num-people-val').textContent = val === 8 ? '8+' : val;
      await handlePeopleChange();
    };

    window.handlePeopleChange = async function handlePeopleChange() {
      const input = document.getElementById('num-people');
      if (!input) return;
      const val = parseInt(input.value, 10);
      const container = document.getElementById('booking-details-container');
      const contactMsg = document.getElementById('contact-admin-msg');

      if (val >= 8) {
        container.style.display = 'none';
        contactMsg.style.display = 'block';
      } else {
        container.style.display = 'block';
        contactMsg.style.display = 'none';

        // Update time slots dynamically from Backend
        const timeContainer = document.getElementById('time-slots-container');
        if (timeContainer) {
          timeContainer.innerHTML = '<div style="grid-column: span 3; text-align:center; padding:12px; font-size:12px; color:var(--ink-3);">Loading availability...</div>';

          let slots = [];
          try {
            const monthStr = String(selMonth + 1).padStart(2, '0');
            const dayStr = String(selDay).padStart(2, '0');
            const dateIso = `${selYear}-${monthStr}-${dayStr}`;

            const res = await fetch(`${window.API_BASE_URL}/v1/availability?date=${dateIso}&partySize=${val}`);
            if (res.ok) {
              const resData = await res.json();
              slots = resData.data?.slots || [];
            }
          } catch (e) {
            console.error('Error fetching availability:', e);
          }

          timeContainer.innerHTML = '';
          let checkedAdded = false;

          if (slots.length === 0) {
            timeContainer.innerHTML = '<div style="grid-column: span 3; text-align:center; padding:12px; font-size:12px; color:var(--ink-3);">No time slots available</div>';
          } else {
            slots.forEach(slot => {
              const tId = 't_' + slot.startTime.replace(':', '_');

              const radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'time';
              radio.id = tId;
              radio.value = slot.startTime;
              radio.className = 'time-radio';
              if (!slot.available) {
                radio.disabled = true;
              } else if (!checkedAdded) {
                radio.checked = true;
                checkedAdded = true;
              }

              const label = document.createElement('label');
              label.htmlFor = tId;
              label.className = 'time-label' + (!slot.available ? ' disabled' : '');
              if (!slot.available) {
                label.style.opacity = '0.5';
                label.style.pointerEvents = 'none';
                label.style.textDecoration = 'line-through';
              }

              const span = document.createElement('span');
              span.className = 'time-text';
              span.textContent = `${slot.startTime} – ${slot.endTime}`;

              label.appendChild(span);
              timeContainer.appendChild(radio);
              timeContainer.appendChild(label);
            });
          }
        }

        // Update Name Inputs
        const namesContainer = document.getElementById('names-container');
        namesContainer.innerHTML = '';
        const lang = localStorage.getItem('lang') || 'th';
        for (let i = 1; i <= val; i++) {
          const wrap = document.createElement('div');
          wrap.className = 'input-wrap';

          const icon = document.createElement('span');
          icon.className = 'material-symbols-outlined input-icon';
          icon.style.fontSize = '16px';
          icon.textContent = 'person';

          const input = document.createElement('input');
          input.className = 'form-input name-input';
          input.type = 'text';
          input.placeholder = lang === 'en' ? `Full name (Person ${i})` : `ชื่อ-นามสกุล (คนที่ ${i})`;
          input.required = true;
          if (i === 1) {
            input.autocomplete = 'name';
            if (window.lineDisplayName) {
              input.value = window.lineDisplayName;
            }
          }

          wrap.appendChild(icon);
          wrap.appendChild(input);
          namesContainer.appendChild(wrap);
        }
      }
    };

    // Run on initial load to set correct UI state
    handlePeopleChange();
    renderCal();
  
