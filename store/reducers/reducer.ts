import {combineReducers} from '@reduxjs/toolkit';
import settings from './settings';

export const reducers = combineReducers({settings});

export type RootState = ReturnType<typeof reducers>;
