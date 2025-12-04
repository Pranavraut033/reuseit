import * as yup from 'yup';

import { CreateLocationInput } from '~/__generated__/graphql';

import { t } from './i18n';

export type EventCreateFormData = {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date | null;
  imageUrl: string[];
  location?: CreateLocationInput;
  locationId?: string;
};

export type LocationCreateFormData = CreateLocationInput;

export const eventCreateSchema: yup.ObjectSchema<EventCreateFormData> = yup.object().shape({
  title: yup
    .string()
    .required(t('eventCreate.titleRequired'))
    .min(3, t('eventCreate.titleMinLength'))
    .max(100, t('eventCreate.titleMaxLength'))
    .trim(),

  description: yup.string().optional().max(1000, t('eventCreate.descriptionMaxLength')).trim(),

  startTime: yup
    .date()
    .required(t('eventCreate.startTimeRequired'))
    .min(new Date(), t('eventCreate.startTimeFuture')),

  endTime: yup
    .date()
    .optional()
    .nullable()
    .min(yup.ref('startTime'), t('eventCreate.endTimeAfterStart')),

  imageUrl: yup.array().of(yup.string().required()).required().default([]).defined(),

  location: yup
    .object()
    .shape({
      street: yup.string().required(t('eventCreate.locationStreetRequired')),
      city: yup.string().optional(),
      country: yup.string().required(t('eventCreate.locationCountryRequired')),
      coordinates: yup.tuple([yup.number().required(), yup.number().required()]).required(),
      type: yup.string().required(),
      postalCode: yup.string().optional(),
      googlePlaceId: yup.string().optional(),
      additionalInfo: yup.string().optional(),
      addressLine2: yup.string().optional(),
    })
    .optional(),

  locationId: yup.string().optional(),
});
