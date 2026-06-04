import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Subscription } from '../models/Schemas';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'shop_admin' | 'barber' | 'customer';
  shopId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// =========================================================================
// 1. AUTHENTICATE USER MIDDLEWARE
// =========================================================================
export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Åtkomst nekad. Ingen token tillhandahölls.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Ogiltig eller utgången token.' });
    return;
  }
};

// =========================================================================
// 2. ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// =========================================================================
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Ej autentiserad.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Behörighet saknas för denna åtgärd.' });
      return;
    }

    next();
  };
};

// =========================================================================
// 3. TENANT-BASED ACCESS CONTROL (TBAC) MIDDLEWARE
// =========================================================================
export const verifyTenantAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Ej autentiserad.' });
    return;
  }

  if (req.user.role === 'super_admin') {
    next();
    return;
  }

  const paramShopId = req.params.shopId || req.query.shopId || req.body.shopId;

  if (!paramShopId) {
    res.status(400).json({ error: 'Salongs-ID (shopId) saknas i anropet.' });
    return;
  }

  if (!req.user.shopId || req.user.shopId.toString() !== paramShopId.toString()) {
    res.status(403).json({ error: 'Behörighet saknas. Du kan inte komma åt en annan salongs data.' });
    return;
  }

  next();
};

// =========================================================================
// 4. SUBSCRIPTION CONTROL MIDDLEWARE
// =========================================================================
export const checkSubscriptionActive = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Ej autentiserad.' });
    return;
  }

  if (req.user.role === 'super_admin') {
    next();
    return;
  }

  const shopId = req.user.shopId || req.params.shopId || req.query.shopId || req.body.shopId;
  if (!shopId) {
    res.status(400).json({ error: 'Salongs-ID (shopId) saknas.' });
    return;
  }

  try {
    const sub = await Subscription.findOne({ shopId: new Types.ObjectId(shopId as string) });

    if (!sub) {
      next();
      return;
    }

    if (sub.status === 'suspended') {
      const allowedPaths = ['/billing', '/settings', '/payment-methods'];
      const isAllowedRoute = allowedPaths.some(path => req.path.includes(path));

      if (req.method === 'GET' || isAllowedRoute) {
        next();
        return;
      }

      res.status(402).json({
        error: 'Salongens prenumeration är avstängd på grund av utebliven betalning.',
        code: 'SUBSCRIPTION_SUSPENDED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Fel vid kontroll av prenumerationsstatus:', error);
    res.status(500).json({ error: 'Internt serverfel vid kontroll av abonnemang.' });
  }
};
