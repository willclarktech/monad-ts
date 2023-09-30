import type { Monad } from "./monad";
import type { Monoid } from "./monoid";

export const writerFactory: <B, M extends Monoid<B>>(
	emptyMonoid: M,
) => { new (value: B, logs: M): Monad<B>; pure<A>(value: A): Monad<A> } = <
	B,
	M extends Monoid<B>,
>(
	emptyMonoid: M,
) =>
	class Writer<A> implements Monad<A> {
		public constructor(public readonly value: A, public readonly logs: M) {}

		public fmap<C>(f: (a: A) => C): Writer<C> {
			return new Writer(f(this.value), this.logs);
		}

		public static pure<C>(value: C): Writer<C> {
			return new Writer(value, emptyMonoid);
		}

		public apply<C>(fac: Writer<(a: A) => C>): Writer<C> {
			const newValue = fac.value(this.value);
			// TODO: Figure out if it's possible to avoid this cast
			const newLogs = this.logs.concat(fac.logs) as M;
			return new Writer(newValue, newLogs);
		}

		public static join<C>(writer: Writer<Writer<C>>): Writer<C> {
			const innerWriter = writer.value;
			// TODO: Figure out if it's possible to avoid this cast
			const newLogs = writer.logs.concat(innerWriter.logs) as M;
			return new Writer(innerWriter.value, newLogs);
		}

		public bind<C>(f: (a: A) => Writer<C>): Writer<C> {
			return Writer.join(this.fmap(f));
		}
	};
