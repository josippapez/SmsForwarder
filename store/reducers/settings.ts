import {createSlice} from '@reduxjs/toolkit';

export interface SettingsState {
  includes: string;
  phoneNumber: string;
  body: string;
}

const initialState: SettingsState = {
  includes: '',
  phoneNumber: '',
  body: '',
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
  },
});

export const {setIncludes, setPhoneNumber, setBody} = settings.actions;

export default settings.reducer;
