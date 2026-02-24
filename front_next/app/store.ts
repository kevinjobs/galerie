import { atom } from 'jotai';
import { UserPlain } from './typings';

export const userAtom = atom<UserPlain | null>(null);