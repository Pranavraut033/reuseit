import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum GermanBin {
  GELBER_SACK = 'Gelber Sack',
  PAPIER = 'Papier',
  GLAS = 'Glas',
  RESTMUELL = 'Restmüll',
  SPERRMUELL = 'Sperrmüll',
  ELEKTROSCHROTT = 'Elektroschrott',
  BIOMUELL = 'Biomüll',
  SCHADSTOFFSAMMLUNG = 'Schadstoffsammlung',
  UNKNOWN = 'Unknown',
}

registerEnumType(GermanBin, { name: 'GermanBin' });

@ObjectType()
export class RecyclingInfo {
  @Field()
  objectName: string;

  @Field(() => [String])
  materials: string[];

  @Field(() => GermanBin)
  bin: GermanBin;

  @Field(() => [String])
  rules: string[];

  @Field({ nullable: true })
  cityOverride?: string;
}

@ObjectType()
export class FinalRecyclingResult {
  @Field()
  objectName: string;

  @Field(() => [String])
  materials: string[];

  @Field(() => RecyclingInfo)
  recycling: RecyclingInfo;

  @Field()
  instructions: string;
}
