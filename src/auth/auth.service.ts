import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          nickname: dto.nickname,
        },
      });
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new ForbiddenException('Access Denied');

    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(dto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: dto.refreshToken },
      });

      if (!tokenRecord) throw new ForbiddenException('Access Denied');

      // Rotation: Delete existing token
      await this.prisma.refreshToken.delete({
        where: { token: dto.refreshToken },
      });

      const tokens = await this.getTokens(payload.sub, payload.email);
      await this.updateRefreshToken(payload.sub, tokens.refreshToken);

      return {
        ...tokens,
        expiresIn: 3600,
      };
    } catch (e) {
      throw new ForbiddenException('Invalid Refresh Token');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: expiry,
      },
    });
  }

  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret',
          expiresIn: '1h',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
          expiresIn: '7d',
        },
      ),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}
