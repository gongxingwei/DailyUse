import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// Performance monitoring configuration
const prismaConfig = {
  log: [
    { emit: 'event' as const, level: 'query' as const },
    { emit: 'stdout' as const, level: 'info' as const },
    { emit: 'stdout' as const, level: 'warn' as const },
    { emit: 'stdout' as const, level: 'error' as const },
  ],
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.prisma;
}

// Log slow queries (>100ms) in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 100) {
      console.warn(`[SLOW QUERY] ${e.duration}ms - ${e.query}`);
    }
  });
}

export default prisma;
