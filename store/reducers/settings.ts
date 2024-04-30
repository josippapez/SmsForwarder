import {createSlice} from '@reduxjs/toolkit';

export interface SettingsState {
  includes: {id: string; text: string}[];
  phoneNumber: string;
  body: string;
  readPermissionsPolicy: boolean;
}

const initialState: SettingsState = {
  includes: [{id: '1', text: ''}],
  phoneNumber: '',
  body: '',
  readPermissionsPolicy: false,
};

export const settings = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setIncludes: (state, action) => {
      state.includes = action.payload;
    },
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setBody: (state, action) => {
      state.body = action.payload;
    },
    setReadPermissionsPolicy: (state, action) => {
      state.readPermissionsPolicy = action.payload;
    },
  },
});

export const {setIncludes, setPhoneNumber, setBody, setReadPermissionsPolicy} =
  settings.actions;

export default settings.reducer;
