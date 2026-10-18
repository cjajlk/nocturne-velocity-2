export class PersistenceError extends Error {
 constructor(code,cause){super(code,{cause});this.name='PersistenceError';this.code=code;}
}
export const fail=code=>{throw new PersistenceError(code);};
export function storageError(error){return error instanceof PersistenceError?error:new PersistenceError(error?.name==='QuotaExceededError'?'quota-exceeded':error?.name==='VersionError'?'future-database':error?.name==='AbortError'?'transaction-aborted':'storage-unavailable',error);}
