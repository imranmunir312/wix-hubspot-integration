import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SyncDirection, TransformType } from '../../common/enums/mapping.enums';

class MappingRowDto {
  @IsString()
  wixFieldKey: string;

  @IsString()
  hubspotPropertyName: string;

  @IsIn(Object.values(SyncDirection))
  direction: SyncDirection;

  @IsOptional()
  @IsIn(Object.values(TransformType))
  transformType: TransformType;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class SaveMappingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MappingRowDto)
  mappings: MappingRowDto[];
}
