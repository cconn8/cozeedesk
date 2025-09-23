# Multi-Tenant SaaS Authentication System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Design](#database-design)
4. [Core Components](#core-components)
5. [Authentication Flow](#authentication-flow)
6. [Security Implementation](#security-implementation)
7. [Code Structure](#code-structure)
8. [Usage Examples](#usage-examples)
9. [Scaling Considerations](#scaling-considerations)

## Overview

This implementation provides a complete, production-ready multi-tenant SaaS authentication system for CozeDesk. The system supports multiple business workspaces per user, intelligent tenant detection, and secure JWT-based authentication with tenant isolation.

### Key Features
- **Multi-tenant architecture** with shared and dedicated database modes
- **Intelligent login flow** that automatically handles single vs. multi-tenant scenarios
- **Secure JWT tokens** scoped to specific tenants
- **Intermediate token system** for secure tenant selection
- **Automatic tenant creation** during signup
- **Subdomain-based tenant routing** for paid vs. free plans

## Architecture Decisions

### 1. Native MongoDB Driver vs. Mongoose

**Decision**: Used native MongoDB driver
**Why**: 
- **Performance**: 20-30% faster than Mongoose ODM
- **Multi-tenant flexibility**: Easier connection management for multiple databases
- **Memory efficiency**: Lower overhead per connection
- **Direct control**: Better handling of dynamic tenant switching

```typescript
// Connection management allows dynamic tenant database switching
async getTenantDb(tenantId: string): Promise<Db> {
  const tenant = await this.getTenantConfig(tenantId);
  
  if (tenant.dbMode === 'dedicated') {
    return this.getDedicatedConnection(tenant.dbName);
  }
  
  return this.getSharedConnection().db('shared_tenant_data');
}
```

### 2. Database Architecture Pattern

**Decision**: Master database + tenant-specific databases
**Why**:
- **Scalability**: Each tenant can have dedicated resources
- **Data isolation**: Complete separation for enterprise clients
- **Compliance**: Easier to meet data residency requirements
- **Performance**: Tenant-specific optimizations and indexing

## Database Design

### Master Database (`tenant_master`)

Contains global user data and tenant metadata:

```javascript
// Users Collection
{
  _id: ObjectId,
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe", 
  passwordHash: "bcrypt_hash",
  tenantMemberships: [
    {
      tenantId: ObjectId,
      businessName: "Acme Corp",
      roles: ["admin", "user"],
      joinedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Tenants Collection  
{
  _id: ObjectId,
  businessName: "Acme Corp",
  subdomain: "acme",
  plan: "paid", // "free" | "paid"
  dbMode: "dedicated", // "shared" | "dedicated"
  dbName: "tenant_acme", // for dedicated mode
  ownerId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Why This Schema Design?

1. **Global User Identity**: Email is unique across all tenants, enabling cross-tenant user lookup
2. **Tenant Memberships Array**: Users can belong to multiple businesses with different roles
3. **Flexible Database Modes**: Free users share resources, paid users get dedicated databases
4. **Subdomain Generation**: Automatic creation of unique business identifiers

## Core Components

### 1. DatabaseService - Connection Management

```typescript
@Injectable()
export class DatabaseService {
  private masterClient: MongoClient;
  private tenantClients = new Map<string, MongoClient>();
  
  // Manages multiple database connections
  async getTenantDb(tenantId: string): Promise<Db> {
    // Determines if tenant uses shared or dedicated database
  }
}
```

**Purpose**: Abstracts database connection complexity, enabling seamless switching between tenant databases.

### 2. UsersService - Multi-Tenant User Management

```typescript
async findByEmail(email: string): Promise<User[]> {
  // Returns ALL users with this email across tenants
  // Critical for login flow - user might belong to multiple tenants
}

async addTenantMembership(userId: ObjectId, membership: TenantMembership) {
  // Adds user to a new tenant workspace
  // Used when inviting users to existing businesses
}
```

**Why Return Array**: A user with one email can be a member of multiple businesses.

### 3. TenantsService - Business Workspace Management

```typescript
async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
  const subdomain = this.generateSubdomain(businessName);
  const plan = createTenantDto.plan || 'free';
  
  const tenant = {
    businessName,
    subdomain,
    plan,
    dbMode: plan === 'paid' ? 'dedicated' : 'shared',
    dbName: plan === 'paid' ? `tenant_${subdomain}` : undefined,
    // ...
  };
}
```

**Business Logic**: 
- Free plans use shared database
- Paid plans get dedicated databases
- Subdomains auto-generated from business names

### 4. AuthService - JWT and Token Management

```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  tenantId: string;   // Current tenant context
  roles: string[];    // User's roles in this tenant
}
```

**Token Scoping**: JWTs are tenant-specific, preventing cross-tenant access even if token is compromised.

## Authentication Flow

### Signup Flow
```mermaid
sequenceDiagram
    Client->>API: POST /auth/signup {firstName, lastName, email, password, businessName}
    API->>UsersService: Create user
    API->>TenantsService: Create tenant/business
    API->>UsersService: Add user to tenant as admin
    API->>AuthService: Generate JWT for tenant
    API->>Client: {jwt, subdomain, user, tenant}
```

### Login Flow - Single Tenant
```mermaid
sequenceDiagram
    Client->>API: POST /auth/login {email, password}
    API->>UsersService: Find users by email
    Note over API: User belongs to 1 tenant only
    API->>AuthService: Generate JWT
    API->>Client: {jwt, subdomain, user, tenant}
```

### Login Flow - Multi-Tenant
```mermaid
sequenceDiagram
    Client->>API: POST /auth/login {email, password}
    API->>UsersService: Find users by email  
    Note over API: User belongs to multiple tenants
    API->>AuthService: Generate intermediate token (2min expiry)
    API->>Client: {requiresTenantSelection: true, intermediateToken, tenants[]}
    Client->>API: POST /auth/select-tenant {tenantId, intermediateToken}
    API->>AuthService: Verify intermediate token
    API->>AuthService: Generate final JWT
    API->>Client: {jwt, subdomain, user, tenant}
```

### Why Intermediate Tokens?

1. **Security**: Prevents indefinite tenant selection windows
2. **Proof of Authentication**: Verifies password was already checked
3. **Short Expiry**: 2-minute window reduces attack surface
4. **Clean Separation**: Authentication vs. authorization phases

## Security Implementation

### 1. Password Security
```typescript
const saltRounds = 12;
const passwordHash = await bcrypt.hash(password, saltRounds);
```
- **High salt rounds**: Protects against rainbow table attacks
- **Unique salts**: Each password gets unique salt

### 2. JWT Security
```typescript
const payload: JwtPayload = {
  sub: userId.toString(),
  email: user.email,
  tenantId: tenantId.toString(),
  roles: userRoles,
};

return this.jwtService.signAsync(payload, {
  secret: this.configService.get<string>('JWT_SECRET'),
  expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
});
```

**Security Features**:
- **Tenant-scoped tokens**: Prevents cross-tenant access
- **Role-based access**: Different permissions per tenant
- **Configurable expiry**: Balance security vs. user experience

### 3. Route Protection
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@User() user: CurrentUser) {
  // user.tenantId automatically extracted from JWT
  // user.roles available for authorization
}
```

**Guard Implementation**:
- **Automatic token extraction**: From Authorization header
- **JWT verification**: Using configured secret
- **Context injection**: User data available in route handlers

## Code Structure

### Directory Organization
```
src/
├── auth/
│   ├── decorators/user.decorator.ts    # @User() parameter decorator
│   ├── dto/create-auth.dto.ts          # Request/response DTOs
│   ├── guards/jwt-auth.guard.ts        # Route protection
│   ├── auth.controller.ts              # Authentication endpoints
│   ├── auth.module.ts                  # Module configuration
│   └── auth.service.ts                 # Authentication logic
├── database/
│   ├── database.service.ts             # Connection management
│   └── database.module.ts              # Database module
├── tenants/
│   ├── interfaces/tenant.interface.ts  # Tenant types
│   ├── tenants.service.ts              # Tenant operations
│   └── tenants.module.ts               # Tenant module
└── users/
    ├── interfaces/user.interface.ts    # User types
    ├── users.service.ts                # User operations
    └── users.module.ts                 # User module
```

### Dependency Injection Flow
```typescript
AppModule
├── ConfigModule (Global)
├── DatabaseModule
│   └── DatabaseService
├── UsersModule
│   └── UsersService → DatabaseService
├── TenantsModule  
│   └── TenantsService → DatabaseService
└── AuthModule
    ├── AuthService → UsersService, TenantsService, JwtService
    └── AuthController → AuthService, TenantsService
```

## Usage Examples

### 1. User Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "securepassword123",
    "businessName": "Acme Corporation"
  }'
```

**Response**:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subdomain": "app.cozeedesk.com",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tenant": {
    "id": "507f1f77bcf86cd799439012", 
    "businessName": "Acme Corporation",
    "plan": "free"
  }
}
```

### 2. Single Tenant Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response** (same as signup):
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subdomain": "app.cozeedesk.com",
  "user": {...},
  "tenant": {...}
}
```

### 3. Multi-Tenant Login (Requires Selection)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com", 
    "password": "securepassword123"
  }'
```

**Response**:
```json
{
  "requiresTenantSelection": true,
  "intermediateToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenants": [
    {
      "tenantId": "507f1f77bcf86cd799439012",
      "businessName": "Acme Corporation", 
      "subdomain": "acme",
      "roles": ["admin"]
    },
    {
      "tenantId": "507f1f77bcf86cd799439013",
      "businessName": "Beta Industries",
      "subdomain": "beta", 
      "roles": ["user"]
    }
  ]
}
```

### 4. Tenant Selection
```bash
curl -X POST http://localhost:3000/auth/select-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "507f1f77bcf86cd799439012",
    "intermediateToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response**:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subdomain": "acme.cozeedesk.com",
  "user": {...},
  "tenant": {
    "id": "507f1f77bcf86cd799439012",
    "businessName": "Acme Corporation",
    "plan": "paid"
  }
}
```

### 5. Protected Route Access
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "message": "Protected route accessed successfully",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com", 
    "tenantId": "507f1f77bcf86cd799439012",
    "roles": ["admin"]
  }
}
```

## Scaling Considerations

### Performance Optimizations

1. **Database Indexes**:
```javascript
// Critical indexes for performance
db.users.createIndex({ email: 1 })
db.tenants.createIndex({ subdomain: 1 })
db.tenants.createIndex({ ownerId: 1 })
```

2. **Connection Pooling**:
```typescript
// Automatic connection reuse for tenant databases
private tenantClients = new Map<string, MongoClient>();
```

3. **JWT Validation Caching**:
Consider Redis caching for JWT validation in high-traffic scenarios.

### Security Enhancements

1. **Rate Limiting**:
```typescript
// Add to AuthController
@UseGuards(ThrottlerGuard)
@Post('login')
```

2. **Refresh Tokens**:
```typescript
// Implement refresh token rotation
interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  tokenFamily: string;
}
```

3. **Audit Logging**:
```typescript
// Log all authentication events
async logAuthEvent(userId: string, event: string, metadata: any) {
  await this.auditService.log({
    userId,
    event,
    timestamp: new Date(),
    metadata
  });
}
```

### Multi-Region Support

1. **Database Sharding**:
```typescript
// Route tenants to regional databases
getDatabaseUrl(tenantId: string): string {
  const region = this.getTenantRegion(tenantId);
  return this.configService.get(`MONGODB_URI_${region}`);
}
```

2. **CDN Integration**:
```typescript
// Serve static assets from regional CDNs
getAssetUrl(tenant: Tenant): string {
  return tenant.plan === 'paid' 
    ? `https://cdn-${tenant.region}.cozeedesk.com`
    : 'https://cdn.cozeedesk.com';
}
```

### Monitoring and Observability

1. **Health Checks**:
```typescript
@Get('health')
async checkHealth() {
  const dbStatus = await this.databaseService.ping();
  return { status: 'ok', database: dbStatus };
}
```

2. **Metrics Collection**:
```typescript
// Track authentication metrics
@Injectable()
export class MetricsService {
  @InjectMetric('auth_attempts_total') 
  private authAttempts: Counter;
  
  recordAuthAttempt(success: boolean, tenantId: string) {
    this.authAttempts.inc({ success, tenantId });
  }
}
```

## Conclusion

This multi-tenant authentication system provides a solid foundation for a scalable SaaS application. The architecture supports both simple single-tenant scenarios and complex multi-tenant workflows while maintaining strong security boundaries and performance characteristics.

Key benefits of this implementation:
- **Scalable**: Handles growth from single user to enterprise
- **Secure**: Multiple layers of security with tenant isolation
- **Flexible**: Supports various business models and tenant structures  
- **Maintainable**: Clean separation of concerns and dependency injection
- **Production-ready**: Error handling, validation, and monitoring hooks

The system is designed to grow with your business, supporting everything from free tier users to enterprise clients with dedicated infrastructure.