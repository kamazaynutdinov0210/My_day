import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class KeyPairDto {
  @IsString()
  @IsIn(['RSA-OAEP', 'ECC'])
  algorithm!: 'RSA-OAEP' | 'ECC';

  @IsOptional()
  @IsInt()
  @IsIn([2048, 4096])
  keySize?: 2048 | 4096;

  @IsOptional()
  @IsString()
  @IsIn(['prime256v1', 'secp256k1'])
  curve?: 'prime256v1' | 'secp256k1';
}

