// booking.js
// LIFF Digital Business Card & Scanner Logic

// DOM Elements
const userAvatarEl = document.getElementById('user-avatar');
const welcomeTextEl = document.getElementById('welcome-text');
const userStatusMsgEl = document.getElementById('user-status-msg');

const studentIdInput = document.getElementById('student-id');
const courseNameInput = document.getElementById('course-name');

const previewAvatarEl = document.getElementById('preview-avatar');
const previewNameEl = document.getElementById('preview-name');
const previewStudentIdEl = document.getElementById('preview-student-id');
const previewCourseEl = document.getElementById('preview-course');

const sendCardBtn = document.getElementById('send-card-btn');
const shareCardBtn = document.getElementById('share-card-btn');
const scanQrBtn = document.getElementById('scan-qr-btn');

const scanResultContainer = document.getElementById('scan-result-container');
const scanResultText = document.getElementById('scan-result-text');
const sendResultBtn = document.getElementById('send-result-btn');

// User profile state
let userProfile = {
  displayName: 'คุณผู้ใช้งาน',
  pictureUrl: 'https://via.placeholder.com/150/2563eb/ffffff?text=Avatar',
  userId: ''
};

// 1. LIFF Initialization (3.1)
async function initLiff() {
  const liffId = window.LIFF_CONFIG?.liffId;
  if (!liffId) {
    console.warn('LIFF_ID not found in configuration! Switching to Mock Mode.');
    loadMockProfile();
    setupMockActions();
    return;
  }

  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // Get User Profile (3.1)
    const profile = await liff.getProfile();
    userProfile.displayName = profile.displayName;
    if (profile.pictureUrl) {
      userProfile.pictureUrl = profile.pictureUrl;
    }
    userProfile.userId = profile.userId;

    // Display greeting and profile details on screen (3.1)
    welcomeTextEl.textContent = `สวัสดี ${profile.displayName}`;
    userAvatarEl.src = userProfile.pictureUrl;
    previewAvatarEl.src = userProfile.pictureUrl;
    previewNameEl.textContent = profile.displayName;
    userStatusMsgEl.textContent = profile.statusMessage || 'ไม่มีสถานะ';

    setupLiffActions();
  } catch (error) {
    console.error('LIFF Init error, switching to Mock Mode:', error.message);
    loadMockProfile();
    setupMockActions();
  }
}

// Update live preview when inputs change
function updatePreview() {
  previewStudentIdEl.textContent = studentIdInput.value || '65000001';
  previewCourseEl.textContent = courseNameInput.value || 'เทคโนโลยีสารสนเทศ';
}

studentIdInput.addEventListener('input', updatePreview);
courseNameInput.addEventListener('input', updatePreview);

// 2. Setup Actions for LINE App Client
function setupLiffActions() {
  updatePreview();

  // Send Personal Card button handler (3.2)
  sendCardBtn.addEventListener('click', async () => {
    if (!liff.isInClient()) {
      alert('ฟังก์ชันนี้ใช้งานได้เฉพาะภายในห้องแชท LINE (กรุณาเปิดด้วยแอป LINE)');
      console.log('Flex Message payload:', JSON.stringify(getPersonalCardFlex(), null, 2));
      return;
    }

    try {
      const cardPayload = getPersonalCardFlex();
      await liff.sendMessages([cardPayload]);
      showSuccessAlert('ส่งนามบัตรของคุณเข้าห้องแชทเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('liff.sendMessages error:', err.message);
      alert('ไม่สามารถส่งข้อความได้: ' + err.message);
    }
  });

  // Share Lecturer Card button handler (3.3)
  shareCardBtn.addEventListener('click', async () => {
    try {
      const coachCardPayload = getCoachNenCardFlex();
      if (liff.isApiAvailable('shareTargetPicker')) {
        const res = await liff.shareTargetPicker([coachCardPayload]);
        if (res) {
          showSuccessAlert('แชร์นามบัตร อ.เณร สำเร็จแล้ว!');
        } else {
          console.log('แชร์การคัดกรองเป้าหมายถูกยกเลิก');
        }
      } else {
        alert('ฟังก์ชันแชร์เป้าหมาย (shareTargetPicker) ไม่เปิดใช้งานในห้องแชทนี้');
      }
    } catch (err) {
      console.error('liff.shareTargetPicker error:', err.message);
      alert('ไม่สามารถแชร์ข้อความได้: ' + err.message);
    }
  });

  // QR Code Scanner button handler (3.4)
  scanQrBtn.addEventListener('click', async () => {
    if (!liff.isApiAvailable('scanCodeV2')) {
      alert('ฟังก์ชันการสแกนกล้อง (scanCodeV2) ไม่รองรับบนอุปกรณ์/เบราว์เซอร์นี้');
      return;
    }

    try {
      const result = await liff.scanCodeV2();
      const codeValue = result.value;

      if (codeValue) {
        showScanResult(codeValue);
      }
    } catch (err) {
      console.error('liff.scanCodeV2 error:', err.message);
      // scanCodeV2 can be cancelled
      if (err.message !== 'Webview control error') {
        alert('สแกน QR Code ล้มเหลว: ' + err.message);
      }
    }
  });
}

// 3. Setup Actions for Browser Mock mode (for developer convenience on PC)
function loadMockProfile() {
  welcomeTextEl.textContent = `สวัสดี ${userProfile.displayName} (Mock Mode)`;
  userAvatarEl.src = userProfile.pictureUrl;
  previewAvatarEl.src = userProfile.pictureUrl;
  previewNameEl.textContent = userProfile.displayName;
  userStatusMsgEl.textContent = 'เปิดใช้งานบนเว็บบราวเซอร์ภายนอก';
  updatePreview();
}

function setupMockActions() {
  sendCardBtn.addEventListener('click', () => {
    const cardPayload = getPersonalCardFlex();
    console.log('🚀 [Mock Mode] Sending message to chat:', cardPayload);
    alert('ส่งนามบัตรสำเร็จ! (ข้อมูลนามบัตรถูกบันทึกลง console.log)');
  });

  shareCardBtn.addEventListener('click', () => {
    const coachCardPayload = getCoachNenCardFlex();
    console.log('🚀 [Mock Mode] Sharing coach card:', coachCardPayload);
    alert('แชร์นามบัตร อ.เณร สำเร็จ! (ข้อมูลถูกบันทึกลง console.log)');
  });

  scanQrBtn.addEventListener('click', () => {
    const mockCode = prompt('กรุณากรอกข้อความหรือ URL เพื่อจำลองการสแกน QR Code:');
    if (mockCode !== null) {
      showScanResult(mockCode);
    }
  });
}

// Scanned Result display logic (3.4)
function showScanResult(codeValue) {
  scanResultText.textContent = codeValue;
  scanResultContainer.classList.remove('hidden');

  // If in client, enable button to send scanned result to chat
  if (liff.isInClient() || !window.LIFF_CONFIG?.liffId) {
    sendResultBtn.classList.remove('hidden');
    
    // Clear old listener
    const newSendBtn = sendResultBtn.cloneNode(true);
    sendResultBtn.parentNode.replaceChild(newSendBtn, sendResultBtn);
    
    newSendBtn.addEventListener('click', async () => {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `🎯 ผลลัพธ์จากการสแกน QR Code:\n${codeValue}`
          }
        ]);
        showSuccessAlert('ส่งผลการสแกนเข้าห้องแชทเรียบร้อย!');
      } catch (err) {
        alert('ส่งข้อความล้มเหลว: ' + err.message);
      }
    });
  }
}

// Helpers to get card payloads
function getPersonalCardFlex() {
  const studentId = studentIdInput.value || '65000001';
  const course = courseNameInput.value || 'เทคโนโลยีสารสนเทศ';

  return {
    type: 'flex',
    altText: `นามบัตรดิจิทัลของคุณ ${userProfile.displayName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1a1c23',
        paddingAll: '15px',
        contents: [
          {
            type: 'text',
            text: 'DIGITAL BUSINESS CARD',
            weight: 'bold',
            color: '#4fd1c5',
            size: 'sm'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#24283b',
        paddingAll: '20px',
        spacing: 'xl',
        contents: [
          {
            type: 'image',
            url: userProfile.pictureUrl || 'https://via.placeholder.com/150/2563eb/ffffff?text=Avatar',
            size: 'md',
            aspectRatio: '1:1',
            aspectMode: 'cover'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: userProfile.displayName,
                weight: 'bold',
                color: '#ffffff',
                size: 'xl'
              },
              {
                type: 'text',
                text: 'นักศึกษา',
                color: '#a0aec0',
                size: 'xs',
                margin: 'xs'
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: `รหัสนักศึกษา: ${studentId}`,
                    color: '#e2e8f0',
                    size: 'xs'
                  },
                  {
                    type: 'text',
                    text: `หลักสูตร: ${course}`,
                    color: '#e2e8f0',
                    size: 'xs'
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };
}

function getCoachNenCardFlex() {
  return {
    type: 'flex',
    altText: 'นามบัตร อ.เณร (วุฒิพงษ์ ชินศรี)',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1e3a8a',
        paddingAll: '15px',
        contents: [
          {
            type: 'text',
            text: 'LECTURER BUSINESS CARD',
            weight: 'bold',
            color: '#60a5fa',
            size: 'sm'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#1e293b',
        paddingAll: '20px',
        spacing: 'xl',
        contents: [
          {
            type: 'image',
            url: 'https://wutthipong.info/image/box.jpg',
            size: 'md',
            aspectRatio: '1:1',
            aspectMode: 'cover'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'วุฒิพงษ์ ชินศรี',
                weight: 'bold',
                color: '#ffffff',
                size: 'xl'
              },
              {
                type: 'text',
                text: 'อาจารย์ ม.รังสิต',
                color: '#94a3b8',
                size: 'xs',
                margin: 'xs'
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                contents: [
                  {
                    type: 'text',
                    text: 'สาขาวิชาเทคโนโลยีสารสนเทศ',
                    color: '#cbd5e1',
                    size: 'xs'
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        paddingAll: '10px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#3b82f6',
            action: {
              type: 'uri',
              label: 'Website',
              uri: 'https://wutthipong.info'
            }
          }
        ]
      }
    }
  };
}

function showSuccessAlert(msg) {
  alert('🎉 สำเร็จ!\n' + msg);
}

// Run on load
window.addEventListener('DOMContentLoaded', initLiff);
