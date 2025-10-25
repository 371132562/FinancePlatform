import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 认证相关 DTO 类定义
 */
// 用户和角色类型从 user.dto 导入
import type { UserItem } from '../../businessModules/user/user.dto';

/**
 * 登录 DTO
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
export type Login = InstanceType<typeof LoginDto>;

/**
 * 挑战响应类型 - 直接返回加密的随机盐字符串
 */
export type ChallengeResponse = string;

/**
 * 登录响应类型
 */
export type LoginResponse = {
  token: string;
  user: UserItem;
};

/**
 * 登录响应 DTO
 */
export type LoginResponseDto = LoginResponse;

/**
 * 登录（哈希）DTO
 */
export class LoginWithHashDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '加密数据不能为空' })
  encryptedData: string;
}
export type LoginWithHash = InstanceType<typeof LoginWithHashDto>;

/**
 * Token 载荷 DTO
 */
export type TokenPayloadDto = {
  sub: string;
  code: string;
  name: string;
  userId: string;
  userName: string;
  roleId?: string;
  roleName?: string;
  iat?: number;
  exp?: number;
};

/**
 * 用户档案 DTO
 */
export type UserProfileDto = {
  id: string;
  code: string;
  name: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  role: {
    name: string;
    allowedRoutes: string[];
  } | null;
};
