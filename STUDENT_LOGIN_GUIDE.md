# 🎓 Student Login Guide - Campus ERP

## 📋 Quick Summary

| Question | Answer |
|----------|--------|
| **Default Password** | ❌ NO default password - each student has unique password |
| **Email Required** | ✅ YES - Email is the only login credential |
| **Email Verification** | ❌ NO - Currently DISABLED (can be enabled) |
| **How to Get Login?** | Admin creates account with email + password |

---

## 🔐 How Student Login Works

### **1. Login Credentials**
```
Email: student@example.com (or any valid email)
Password: Whatever admin set during creation
```

### **2. Login Steps**

1. **Go to Login Page**
   ```
   URL: http://localhost:5173/login
   ```

2. **Enter Email**
   - Use the email assigned by admin
   - Example: `john.doe@vignan.ac.in`

3. **Enter Password**
   - Password is set by admin when creating student account
   - NO default password exists

4. **Click Login Button**
   - System verifies credentials
   - If correct → Redirected to Student Dashboard
   - If wrong → Shows error message

---

## 📧 Email Verification Status

### **Current Setting (in .env)**
```env
EMAIL_VERIFICATION=false
```

**What this means:**
- ✅ Students can login WITHOUT email verification
- ✅ No email confirmation needed
- ✅ Instant access after account creation

**To Enable Email Verification:**
```env
EMAIL_VERIFICATION=true
```
(Requires SMTP configuration with Gmail or other email service)

---

## ⚙️ How Admin Creates Student Accounts

### **Option 1: Manual Student Creation**

1. **Admin Login** as admin user
2. **Go to Students Page**
   ```
   URL: http://localhost:5173/app/students
   ```
3. **Click "Add Student"**
4. **Fill Form:**
   ```
   Admission Number: ADM2024001
   Name: John Doe
   Email: john.doe@vignan.ac.in
   Department: CSE
   Year: 1
   Section: A
   Phone: 9876543210 (optional)
   ```
5. **System Creates:**
   - Student record in database
   - User account with email + password
   - Password set to default or custom

### **Option 2: Bulk Upload (CSV)**

1. **Prepare CSV File**
   ```csv
   admissionNo,name,email,department,year,section,phone
   ADM2024001,John Doe,john@vignan.ac.in,CSE,1,A,9876543210
   ADM2024002,Jane Smith,jane@vignan.ac.in,ECE,1,B,9876543211
   ADM2024003,Bob Wilson,bob@vignan.ac.in,MECH,2,A,9876543212
   ```

2. **Upload CSV on Students Page**
   - Click "Bulk Upload"
   - Select CSV file
   - Submit
   - All students created instantly

3. **Students Get**
   - Email address (from CSV)
   - Auto-generated password (shown in response)
   - Can login immediately

---

## 👨‍🎓 Student Login Example

### **Real-World Scenario**

**Admin Creates:**
```
Name: Arjun Kumar
Email: arjun.kumar@vignan.ac.in
Admission: ADM2024123
Initial Password: Temp@123
```

**Student Receives:**
```
Email: arjun.kumar@vignan.ac.in
Password: Temp@123
```

**Student Login:**
1. Opens http://localhost:5173/login
2. Enters: arjun.kumar@vignan.ac.in
3. Enters: Temp@123
4. Clicks Login
5. ✅ Redirected to Student Dashboard

**On Dashboard, Student Can:**
- ✅ View Attendance
- ✅ Check Marks
- ✅ Track Fees
- ✅ Access Study Materials
- ✅ View Notices
- ✅ See Library Issues

---

## 🔄 Password Management

### **1. First Login**
```
Email: student@vignan.ac.in
Password: Admin-provided password
→ Login successful
```

### **2. Change Password** (in dashboard)
```
Path: /app/change-password
- Enter current password
- Enter new password
- Confirm new password
- Click "Update"
```

### **3. Forgot Password**
```
Path: /login (click "Forgot Password?")
- Enter email
- System sends reset link
- Click link in email
- Set new password
- Login with new password
```

---

## 🎯 Current Live Credentials

Based on your `.env` file, you may have:

### **Admin Account**
```
Email: sid76sidhu@gmail.com
Password: 123456789
```

### **Test Students**
(These would have been created during setup)

| Email | Password | Role |
|-------|----------|------|
| student@vignan.ac.in | ??? | Student |
| john@vignan.ac.in | ??? | Student |
| jane@vignan.ac.in | ??? | Student |

**To find actual student passwords:**
- Check MongoDB database
- Look in student creation records
- Ask the admin who created them
- OR reset password via "Forgot Password" option

---

## 📱 Student Dashboard After Login

Once logged in, students see:

```
┌─────────────────────────────────────┐
│       STUDENT DASHBOARD             │
├─────────────────────────────────────┤
│                                     │
│  📊 Quick Stats:                    │
│  • Attendance: 75%                  │
│  • Average Marks: 78.5              │
│  • Fee Status: Paid                 │
│  • Books Issued: 2                  │
│                                     │
│  📍 Quick Actions:                  │
│  [View Attendance]                  │
│  [Check Marks]                      │
│  [Fee Status]                       │
│  [Download Materials]               │
│                                     │
│  📢 Notices:                        │
│  • "Exam dates announced"           │
│  • "Fee payment deadline"           │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Invalid email or password"**
```
Cause: Wrong email or password
Fix: 
- Check email spelling
- Verify password
- Use "Forgot Password" to reset
```

### **Issue 2: "User account is inactive"**
```
Cause: Admin deactivated account
Fix:
- Contact admin
- Admin needs to reactivate from Students page
```

### **Issue 3: "Please verify your email to login"**
```
Cause: EMAIL_VERIFICATION=true and email not verified
Fix:
- Check email for verification link
- Click link to verify
- Then login again
- OR Admin disables email verification in .env
```

### **Issue 4: "Token expired"**
```
Cause: Session inactive for >24 hours
Fix:
- Logout (automatic if token expired)
- Login again
```

---

## 🔍 Finding Your Existing Students

### **Method 1: Check Frontend**
```
1. Login as Admin
2. Go to Students page
3. View all students
4. Click on any student
5. Note the email
6. Use that email to login as student
```

### **Method 2: Check Database (MongoDB)**
```javascript
// Connect to MongoDB
mongosh "mongodb+srv://sid76sidhu_db_user:password@cluster0..."

// Find all students
use vignan
db.students.find()

// Output shows: admissionNo, name, email, department, etc.
```

### **Method 3: Check User Collection**
```javascript
// Find all users with role='student'
db.users.find({ role: 'student' })

// Output shows: email, role, status, etc.
```

---

## 🎓 Complete Student Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  ACCOUNT CREATION                                       │
│     Admin adds student → Email + Password assigned         │
│                                                             │
│  2️⃣  FIRST LOGIN                                            │
│     Student: http://localhost:5173/login                   │
│     Email: provided by admin                               │
│     Password: provided by admin                            │
│     → Redirected to dashboard                              │
│                                                             │
│  3️⃣  CHANGE PASSWORD (Optional)                            │
│     Go to: /app/change-password                            │
│     Update password for security                           │
│                                                             │
│  4️⃣  DAILY USAGE                                            │
│     ✅ View Attendance                                      │
│     ✅ Check Marks                                          │
│     ✅ Download Materials                                   │
│     ✅ Track Fees                                           │
│     ✅ Access Notices                                       │
│                                                             │
│  5️⃣  FORGOTTEN PASSWORD                                     │
│     Click "Forgot Password?"                               │
│     → Reset link sent to email                             │
│     → Set new password                                     │
│     → Login with new password                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

**If you have existing students and need to:**

1. **Find their login credentials:**
   - Ask the admin who created the account
   - Check MongoDB database
   - Use "Forgot Password" to reset

2. **Test student login:**
   - Use any student email from the database
   - Reset password via "Forgot Password"
   - Login with new password

3. **Create new students:**
   - Admin: Go to /app/students
   - Click "Add Student"
   - Fill details (email must be unique)
   - System auto-generates password
   - Student receives email notification (if enabled)

---

## ✅ Summary Table

| Feature | Status | Notes |
|---------|--------|-------|
| **Default Password** | ❌ None | Each student gets unique password |
| **Email Login** | ✅ Required | Email is username |
| **Email Verification** | ❌ Disabled | Can be enabled in .env |
| **Auto Email Notify** | ❌ No | Can be added later |
| **Password Reset** | ✅ Yes | Via "Forgot Password" |
| **First Login** | ✅ Automatic | Redirects to dashboard |
| **Session Duration** | 24 hours | JWT token expires |

---

**Happy Learning! 🎓**
