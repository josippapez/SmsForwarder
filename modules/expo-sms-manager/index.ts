import ExpoSmsManagerModule from './src/ExpoSmsManagerModule';

export type SmsFilter = {
  box?: string;
  read?: number;
  _id?: number;
  thread_id?: number;
  address?: string;
  body?: string;
  bodyRegex?: string;
  indexFrom?: number;
  maxCount?: number;
  selection?: string;
  sortOrder?: string;
  maxDate?: number;
  minDate?: number;
};

export type SmsListResult = {
  count: number;
  messages: any[];
};

export async function list(filter: SmsFilter = {}): Promise<SmsListResult> {
  const result = await ExpoSmsManagerModule.list(JSON.stringify(filter));
  return {
    count: result.count,
    messages: JSON.parse(result.messages),
  };
}

export async function send(
  phoneNumber: string,
  message: string,
): Promise<string> {
  return await ExpoSmsManagerModule.autoSend(phoneNumber, message);
}

export async function deleteSms(id: number): Promise<string> {
  return await ExpoSmsManagerModule.delete(id);
}

export {ExpoSmsManagerModule};
