import { ValueObject } from '@dailyuse/utils';

export class Address extends ValueObject {
  private readonly _street: string;
  private readonly _city: string;
  private readonly _state: string;
  private readonly _country: string;
  private readonly _postalCode: string;

  constructor(params: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }) {
    super();
    this._street = params.street;
    this._city = params.city;
    this._state = params.state;
    this._country = params.country;
    this._postalCode = params.postalCode;
  }

  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get country(): string {
    return this._country;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get fullAddress(): string {
    return `${this._street}, ${this._city}, ${this._state} ${this._postalCode}, ${this._country}`;
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Address)) {
      return false;
    }
    return (
      this._street === other._street &&
      this._city === other._city &&
      this._state === other._state &&
      this._country === other._country &&
      this._postalCode === other._postalCode
    );
  }
}
