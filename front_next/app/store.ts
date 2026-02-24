import { atomWithStorage } from 'jotai/utils';
import { UserPlain } from './typings';

export const userAtom = atomWithStorage<UserPlain | null>('user',null);
export const tokenAtom = atomWithStorage<string | null>('token',null);