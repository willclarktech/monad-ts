// eslint-disable-next-line functional/prefer-readonly-type
export type Writable<T> = {
	-readonly [K in keyof T]: T[K];
};
