import { ChannelType } from '@/types/api';

export interface CredentialField {
  key: string;
  label: string;
  hint: string;
}

export interface ChannelSpec {
  channel: ChannelType;
  label: string;
  /** Where in the provider's console the webhook URL goes. */
  setupHint: string;
  accountIdLabel: string;
  accountIdHint: string;
  credentials: CredentialField[];
  brand: string;
}

/**
 * Mirrors each adapter's `requiredCredentials` in the backend.
 *
 * Duplicated deliberately rather than fetched: the labels and hints are UI
 * copy, not API data, and an endpoint returning form metadata would put
 * presentation decisions in the backend. If a `requiredCredentials` list
 * changes, this list changes — the backend rejects a save that disagrees, so
 * the two cannot drift silently.
 */
export const CHANNEL_CATALOG: ChannelSpec[] = [
  {
    channel: ChannelType.Line,
    label: 'LINE Official Account',
    brand: 'bg-[#06C755]/10 text-[#06C755]',
    setupHint: 'วาง URL นี้ใน LINE Developers Console → Messaging API → Webhook URL',
    accountIdLabel: 'Destination ID',
    accountIdHint: 'ไม่บังคับ — ใส่เพื่อกันไม่ให้ payload จากบัญชีอื่นถูกรับเข้ามา',
    credentials: [
      {
        key: 'channelSecret',
        label: 'Channel Secret',
        hint: 'ใช้ตรวจลายเซ็นของ webhook ทุกครั้ง',
      },
      { key: 'accessToken', label: 'Channel Access Token', hint: 'ใช้ส่งข้อความกลับหาลูกค้า' },
    ],
  },
  {
    channel: ChannelType.Facebook,
    label: 'Facebook Messenger',
    brand: 'bg-[#0866FF]/10 text-[#0866FF]',
    setupHint: 'วาง URL นี้ใน Meta for Developers → Webhooks → Callback URL',
    accountIdLabel: 'Page ID',
    accountIdHint: 'ไม่บังคับ — ใส่เพื่อกันไม่ให้ payload จากเพจอื่นถูกรับเข้ามา',
    credentials: [
      { key: 'appSecret', label: 'App Secret', hint: 'ใช้ตรวจลายเซ็น X-Hub-Signature-256' },
      { key: 'accessToken', label: 'Page Access Token', hint: 'ใช้ส่งข้อความกลับหาลูกค้า' },
      {
        key: 'verifyToken',
        label: 'Verify Token',
        hint: 'ข้อความที่คุณตั้งเอง ใช้ตอนที่ Meta ยืนยัน Webhook',
      },
    ],
  },
  {
    channel: ChannelType.Whatsapp,
    label: 'WhatsApp Business',
    brand: 'bg-[#25D366]/10 text-[#25D366]',
    setupHint: 'วาง URL นี้ใน Meta for Developers → WhatsApp → Configuration',
    accountIdLabel: 'Phone Number ID',
    accountIdHint: 'ไม่บังคับ — ใส่เพื่อกันไม่ให้ payload จากเบอร์อื่นถูกรับเข้ามา',
    credentials: [
      { key: 'appSecret', label: 'App Secret', hint: 'ใช้ตรวจลายเซ็น X-Hub-Signature-256' },
      { key: 'accessToken', label: 'Access Token', hint: 'ใช้ส่งข้อความกลับหาลูกค้า' },
      { key: 'verifyToken', label: 'Verify Token', hint: 'ข้อความที่คุณตั้งเอง' },
      { key: 'phoneNumberId', label: 'Phone Number ID', hint: 'ปลายทางที่ใช้ส่งข้อความออก' },
    ],
  },
];
