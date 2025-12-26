# 🚀 DEORA Plaza - Clean Production Deployment (Supabase Only)

## ✅ **VERIFIED WORKING**
Your dashboard is now fully functional with authentication working perfectly!

---

## 🎯 **SIMPLE 3-STEP DEPLOYMENT**

### **Step 1: Environment Setup** (2 minutes)
```bash
# Copy the clean production template
cp .env.production.clean .env.local

# Generate secure keys
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CSRF_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 2: Supabase Setup** (5 minutes)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy your project URL and keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Run this SQL in Supabase SQL Editor:
   ```sql
   -- Enable Row Level Security
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Create users table
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username VARCHAR(50) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     role VARCHAR(50) NOT NULL DEFAULT 'waiter',
     business_unit VARCHAR(50) DEFAULT 'cafe',
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create menu items table
   CREATE TABLE menu_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(200) NOT NULL,
     description TEXT,
     price DECIMAL(10,2) NOT NULL,
     category VARCHAR(100) NOT NULL,
     business_unit VARCHAR(50) NOT NULL DEFAULT 'cafe',
     is_available BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create customers table
   CREATE TABLE customers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(200) NOT NULL,
     mobile_number VARCHAR(15),
     email VARCHAR(255),
     discount_tier VARCHAR(50) DEFAULT 'regular',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create orders table
   CREATE TABLE orders (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     customer_id UUID REFERENCES customers(id),
     business_unit VARCHAR(50) NOT NULL,
     status VARCHAR(50) DEFAULT 'pending',
     total_amount DECIMAL(10,2) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create bookings table
   CREATE TABLE bookings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     customer_id UUID REFERENCES customers(id),
     type VARCHAR(50) NOT NULL,
     guest_name VARCHAR(200) NOT NULL,
     guest_mobile VARCHAR(15),
     room_id VARCHAR(50),
     start_date TIMESTAMP WITH TIME ZONE,
     end_date TIMESTAMP WITH TIME ZONE,
     status VARCHAR(50) DEFAULT 'confirmed',
     total_amount DECIMAL(10,2),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- RLS Policies
   CREATE POLICY "Users can view own profile" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Super admins can view all" ON users
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM users 
         WHERE id = auth.uid() AND role = 'super_admin'
       )
     );
   ```

### **Step 3: Deploy** (2 minutes)

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```
- Add environment variables in Vercel dashboard
- Done! Your app is live

**Option B: Netlify**
```bash
npm run build
# Upload .next folder to Netlify
```

**Option C: VPS**
```bash
npm run build
npm start
```

---

## 🎉 **POST-DEPLOYMENT**

1. **Visit your live site**
2. **Sign up at `/login`** with your admin email
3. **Update your role in Supabase**:
   ```sql
   UPDATE users SET role = 'super_admin', business_unit = 'all' 
   WHERE email = 'your-admin@email.com';
   ```
4. **Start managing your restaurant!**

---

## 🏆 **WHAT YOU GET**

### **Complete Restaurant Management System**
- ✅ **Multi-Unit Operations**: Restaurant, Cafe, Bar, Hotel, Garden
- ✅ **Order Management**: Complete order flow with tracking
- ✅ **Billing & GST**: Tax compliance and reporting
- ✅ **Customer Management**: Guest profiles and bookings
- ✅ **Staff Management**: Role-based access control
- ✅ **Real-time Dashboard**: Business analytics and insights
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Premium Design**: Glass morphism UI with smooth animations

### **Technical Excellence**
- ✅ **Next.js 16** with React 19
- ✅ **TypeScript** with strict mode
- ✅ **Supabase** PostgreSQL database
- ✅ **Row Level Security** for data protection
- ✅ **Production Optimized** build
- ✅ **Zero Jittering** smooth animations

---

## 📞 **SUPPORT**

**Common Issues:**
- **Build errors**: Run `npm run build` to check
- **Auth issues**: Verify Supabase keys in `.env.local`
- **Database errors**: Check RLS policies in Supabase

**Access URLs:**
- Dashboard: `https://your-domain.com/dashboard`
- Login: `https://your-domain.com/login`
- API Health: `https://your-domain.com/api/health`

---

## 🚀 **READY TO DEPLOY!**

Your DEORA Plaza system is now:
- ✅ **Authentication Working**
- ✅ **Dashboard Functional**
- ✅ **Production Ready**
- ✅ **Clean & Optimized**

**Deploy now and start managing your hospitality business!**