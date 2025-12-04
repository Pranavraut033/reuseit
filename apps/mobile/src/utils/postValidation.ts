import * as yup from 'yup';

import { CreatePostInput, PostType } from '~/__generated__/graphql';
import { Flatten } from '~/gql/utils';

import { t } from './i18n';

export type PostCreateFormData = Flatten<CreatePostInput>;

export const postCreateSchema: yup.ObjectSchema<PostCreateFormData> = yup.object({
  postType: yup
    .string<PostType>()
    .oneOf(
      [PostType.General, PostType.Giveaway, PostType.Event, PostType.Meetup],
      'Invalid post type',
    )
    .required(t('postCreate.postTypeRequired'))
    .default(PostType.General),

  anonymous: yup.boolean().required().defined().default(false),

  title: yup
    .string()
    .required(t('postCreate.titleRequired'))
    .min(3, t('postCreate.titleMinLength'))
    .max(100, t('postCreate.titleMaxLength'))
    .trim(),

  description: yup
    .string()
    .required(t('postCreate.descriptionRequired'))
    .max(1000, t('postCreate.descriptionMaxLength'))
    .trim(),

  category: yup.string().when('postType', {
    is: (postType: string) => postType === 'GENERAL' || postType === 'GIVEAWAY',
    then: (schema) =>
      schema
        .oneOf(
          ['electronics', 'toys', 'homeGoods', 'clothing', 'furniture', 'books', 'sports', 'other'],
          'Invalid category',
        )
        .required(t('postCreate.categoryRequired')),
    otherwise: (schema) => schema.optional(),
  }),

  condition: yup.string().when('postType', {
    is: (postType: string) => postType === 'GENERAL' || postType === 'GIVEAWAY',
    then: (schema) =>
      schema
        .required(t('postCreate.conditionRequired'))
        .oneOf(['new', 'likeNew', 'good', 'fair', 'used'], 'Invalid condition'),
    otherwise: (schema) => schema.optional(),
  }),

  tags: yup
    .array()
    .of(yup.string().required())
    .when('postType', {
      is: (postType: string) => postType === 'GENERAL' || postType === 'GIVEAWAY',
      then: (schema) => schema.min(1, 'At least one tag is required').required(),
      otherwise: (schema) => schema.optional(),
    })
    .default([])
    .defined(),

  images: yup
    .array()
    .of(yup.string().required())
    .required()
    .max(4, 'Maximum 4 images allowed')
    .default([])
    .defined(),

  location: yup
    .object({
      name: yup.string().optional(),
      street: yup.string().required(),
      city: yup.string().required(),
      country: yup.string().required(),
      postalCode: yup.string().required(),
      type: yup.string().required(),
      coordinates: yup.tuple([yup.number().required(), yup.number().required()]).required(),
      googlePlaceId: yup.string().optional(),
    })
    .when('postType', {
      is: (postType: string) => postType === 'EVENT' || postType === 'MEETUP',
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.nullable().optional(),
    })
    .default(null),

  locationId: yup.string().optional(),

  eventId: yup.string().optional(),

  pickupDate: yup
    .date()
    .when('postType', {
      is: 'GIVEAWAY',
      then: (schema) =>
        schema
          .required('Pickup date is required for giveaways')
          .min(new Date(), 'Pickup date must be in the future'),
      otherwise: (schema) =>
        schema.nullable().optional().min(new Date(), 'Pickup date must be in the future'),
    })
    .default(null),
});

export const categories = [
  { value: 'electronics', label: t('categories.electronics') },
  { value: 'toys', label: t('categories.toys') },
  { value: 'homeGoods', label: t('categories.homeGoods') },
  { value: 'clothing', label: t('categories.clothing') },
  { value: 'furniture', label: t('categories.furniture') },
  { value: 'books', label: t('categories.books') },
  { value: 'sports', label: t('categories.sports') },
  { value: 'other', label: t('categories.other') },
];

export const conditions = [
  { value: 'new', label: t('conditions.new') },
  { value: 'likeNew', label: t('conditions.likeNew') },
  { value: 'good', label: t('conditions.good') },
  { value: 'fair', label: t('conditions.fair') },
  { value: 'used', label: t('conditions.used') },
];
