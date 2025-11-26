import { CreateLocationInput, CreatePostInput } from '~/__generated__/graphql';

import { Flatten } from './utils';

export type LocationCreateFormData = Flatten<CreateLocationInput>;

export type PostCreateFormData = Flatten<CreatePostInput> & {
  pickupDate: Date | null;
  location: LocationCreateFormData;
};

export type DateTime = string | number | Date;
