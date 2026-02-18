import type { School, Session, Student, Staff, Expense, StudentClass, Stock, FixedMonthlyCost } from "../types";
import { generateId } from "../lib/utils";

export function createSampleSchools(): School[] {
  return [
    { id: "s1", name: "Green Valley School", address: "123 Main St", contact: "+91 98765 43210", isLocked: false },
    { id: "s2", name: "Riverside Academy", address: "45 River Road", contact: "+91 98765 43211", isLocked: false },
    { id: "s3", name: "Sunrise Boarding School", address: "78 Hill View", contact: "+91 98765 43212", isLocked: false },
  ];
}

export function createSampleSessions(): Session[] {
  return [
    { id: "sess1", schoolId: "s1", year: "2023-2024", startDate: "2023-04-01", endDate: "2024-03-31", salaryDueDay: 5 },
    { id: "sess2", schoolId: "s1", year: "2024-2025", startDate: "2024-04-01", endDate: "2025-03-31", salaryDueDay: 5 },
    { id: "sess3", schoolId: "s2", year: "2023-2024", startDate: "2023-04-01", endDate: "2024-03-31", salaryDueDay: 5 },
    { id: "sess4", schoolId: "s2", year: "2024-2025", startDate: "2024-04-01", endDate: "2025-03-31", salaryDueDay: 5 },
    { id: "sess5", schoolId: "s3", year: "2024-2025", startDate: "2024-04-01", endDate: "2025-03-31", salaryDueDay: 5 },
  ];
}

// Store class IDs for referencing in students
const classIdMap: Record<string, Record<string, string>> = {};

export function createSampleClasses(): StudentClass[] {
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  // Default classes: Nursery, LKG, UKG, Class 1-12
  const classTemplates = [
    { name: "Nursery", registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2000, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "LKG", registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2200, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "UKG", registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2400, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 1", registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3000, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 2", registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3200, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 3", registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3400, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 4", registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3600, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 5", registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4000, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 6", registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4200, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 7", registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4400, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 8", registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4600, lateFeeAmount: 50, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 9", registrationFees: 500, admissionFees: 3500, annualFund: 2500, monthlyFees: 5000, lateFeeAmount: 100, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 10", registrationFees: 500, admissionFees: 3500, annualFund: 2500, monthlyFees: 5200, lateFeeAmount: 100, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 11", registrationFees: 500, admissionFees: 4000, annualFund: 3000, monthlyFees: 5500, lateFeeAmount: 100, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
    { name: "Class 12", registrationFees: 500, admissionFees: 4000, annualFund: 3000, monthlyFees: 5800, lateFeeAmount: 100, lateFeeFrequency: "weekly" as const, dueDayOfMonth: 10 },
  ];
  const classes: StudentClass[] = [];
  sessions.forEach((sessionId) => {
    if (!classIdMap[sessionId]) classIdMap[sessionId] = {};
    classTemplates.forEach((t) => {
      const id = generateId();
      classIdMap[sessionId][t.name] = id;
      classes.push({
        id,
        sessionId,
        name: t.name,
        registrationFees: t.registrationFees,
        admissionFees: t.admissionFees,
        annualFund: t.annualFund,
        monthlyFees: t.monthlyFees,
        lateFeeAmount: t.lateFeeAmount,
        lateFeeFrequency: t.lateFeeFrequency,
        dueDayOfMonth: t.dueDayOfMonth,
      });
    });
  });
  return classes;
}

// Helper to get classId for a session
function getClassId(sessionId: string, className: string): string | undefined {
  return classIdMap[sessionId]?.[className];
}

export function createSampleStudents(): Student[] {
  // Each student is assigned a class
  const base = [
    { 
      name: "Aarav Sharma", className: "Class 1", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3000, transportFees: 500,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 45000,
      personal: { fatherName: "Ramesh Sharma", motherName: "Sunita Sharma", guardianPhone: "9876543210", bloodGroup: "A+" as const, currentAddress: "123 Main St, Delhi" }
    },
    { 
      name: "Priya Patel", className: "Class 2", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3500, transportFees: 0,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 52000,
      personal: { fatherName: "Mukesh Patel", motherName: "Rani Patel", guardianPhone: "9876543211", bloodGroup: "B+" as const, currentAddress: "45 Park Avenue, Mumbai" }
    },
    { 
      name: "Rahul Kumar", className: "Nursery", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2000, transportFees: 800,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 18000,
      personal: { fatherName: "Sunil Kumar", motherName: "Meena Kumar", guardianPhone: "9876543212", bloodGroup: "O+" as const, currentAddress: "78 Lake Road, Bangalore" }
    },
    { 
      name: "Ananya Singh", className: "Class 9", feeType: "Boarding + Meals" as const, 
      registrationFees: 500, admissionFees: 3500, annualFund: 2500, monthlyFees: 8000, transportFees: 0,
      dueDay: 10, lateFeeAmt: 100, lateFeeFreq: "weekly" as const, paid: 65000,
      personal: { fatherName: "Rajiv Singh", motherName: "Kavita Singh", guardianPhone: "9876543213", bloodGroup: "AB+" as const, currentAddress: "Hostel Block A", healthIssues: "Mild asthma" }
    },
    { 
      name: "Vikram Reddy", className: "Class 5", feeType: "Day Scholar + Meals" as const, 
      registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4500, transportFees: 600,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 58000,
      personal: { fatherName: "Krishna Reddy", motherName: "Lakshmi Reddy", guardianPhone: "9876543214", bloodGroup: "A-" as const, currentAddress: "56 Garden Street, Hyderabad" }
    },
    { 
      name: "Sneha Nair", className: "LKG", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2200, transportFees: 400,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 0,
      personal: { fatherName: "Gopinath Nair", motherName: "Sarita Nair", guardianPhone: "9876543215", bloodGroup: "B-" as const, currentAddress: "12 Temple Road, Kochi" }
    },
    { 
      name: "Arjun Mehta", className: "Class 10", feeType: "Boarding" as const, 
      registrationFees: 500, admissionFees: 3500, annualFund: 2500, monthlyFees: 6000, transportFees: 0,
      dueDay: 10, lateFeeAmt: 100, lateFeeFreq: "weekly" as const, paid: 60000,
      personal: { fatherName: "Prakash Mehta", motherName: "Nisha Mehta", guardianPhone: "9876543216", bloodGroup: "O-" as const, currentAddress: "Hostel Block B" }
    },
    { 
      name: "Kavya Iyer", className: "Class 3", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2500, annualFund: 1500, monthlyFees: 3400, transportFees: 700,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 30000,
      personal: { fatherName: "Venkat Iyer", motherName: "Padma Iyer", guardianPhone: "9876543217", bloodGroup: "A+" as const, currentAddress: "89 Station Road, Chennai" }
    },
    { 
      name: "Rohan Desai", className: "Class 11", feeType: "Boarding + Meals" as const, 
      registrationFees: 500, admissionFees: 4000, annualFund: 3000, monthlyFees: 8500, transportFees: 0,
      dueDay: 10, lateFeeAmt: 100, lateFeeFreq: "weekly" as const, paid: 95000,
      personal: { fatherName: "Hitesh Desai", motherName: "Priya Desai", guardianPhone: "9876543218", bloodGroup: "AB-" as const, currentAddress: "Hostel Block A" }
    },
    { 
      name: "Isha Gupta", className: "UKG", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 2000, annualFund: 1000, monthlyFees: 2400, transportFees: 500,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 27000,
      personal: { fatherName: "Amit Gupta", motherName: "Reena Gupta", guardianPhone: "9876543219", bloodGroup: "B+" as const, currentAddress: "34 Market Street, Pune", healthIssues: "Peanut allergy" }
    },
    { 
      name: "Aditya Verma", className: "Class 12", feeType: "Regular" as const, 
      registrationFees: 500, admissionFees: 4000, annualFund: 3000, monthlyFees: 5800, transportFees: 600,
      dueDay: 10, lateFeeAmt: 100, lateFeeFreq: "weekly" as const, paid: 72000,
      personal: { fatherName: "Suresh Verma", motherName: "Anita Verma", guardianPhone: "9876543220", bloodGroup: "O+" as const, currentAddress: "56 College Road, Jaipur" }
    },
    { 
      name: "Meera Krishnan", className: "Class 7", feeType: "Day Scholar + Meals" as const, 
      registrationFees: 500, admissionFees: 3000, annualFund: 2000, monthlyFees: 4400, transportFees: 0,
      dueDay: 10, lateFeeAmt: 50, lateFeeFreq: "weekly" as const, paid: 38000,
      personal: { fatherName: "Krishnan R", motherName: "Lakshmi K", guardianPhone: "9876543221", bloodGroup: "A+" as const, currentAddress: "23 Temple Street, Trivandrum" }
    },
  ];
  
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  const students: Student[] = [];
  
  sessions.forEach((sessionId, si) => {
    base.slice(0, 8 + (si % 5)).forEach((b, i) => {
      const id = generateId();
      const payments: Student["payments"] = [];
      const classId = getClassId(sessionId, b.className);
      
      // Calculate total annual fees
      const annualTotal = b.registrationFees + b.admissionFees + b.annualFund + (b.monthlyFees * 12) + (b.transportFees * 12);
      
      if (b.paid > 0) {
        let remaining = b.paid;
        const amts = [b.registrationFees + b.admissionFees + b.annualFund, b.monthlyFees * 3, b.monthlyFees * 3, b.monthlyFees * 3];
        let d = new Date(2023 + (si >= 2 ? 1 : 0), 3 + (i % 3), 5 + (i % 10));
        let catIdx = 0;
        
        while (remaining > 0 && catIdx < amts.length) {
          const amt = Math.min(remaining, amts[catIdx]);
          if (amt > 0) {
            const isFirstPaymentOfFirstStudent = si === 0 && i === 0 && catIdx === 0;
            payments.push({
              id: generateId(),
              date: d.toISOString().slice(0, 10),
              amount: amt,
              method: ["Cash", "Online", "Cheque", "Bank Transfer"][i % 4] as "Cash" | "Online" | "Cheque" | "Bank Transfer",
              receiptNumber: `R-${sessionId.slice(-1)}-${1000 + si * 100 + i * 10 + catIdx}`,
              feeCategory: catIdx === 0 ? "registration" : "monthly",
              month: catIdx > 0 ? `2024-0${3 + catIdx}` : undefined,
              receiptPhotoUrl: isFirstPaymentOfFirstStudent ? "https://placehold.co/400x300/f0f9ff/0f172a?text=Receipt" : undefined,
            });
          }
          remaining -= amt;
          d.setMonth(d.getMonth() + 3);
          catIdx++;
        }
      }
      
      const isFirstOrSecondInSession = i === 0 || i === 1;
      students.push({
        id,
        sessionId,
        classId,
        name: b.name,
        studentId: `STU-${sessionId.slice(-1)}${100 + si * 15 + i}`,
        feeType: b.feeType,
        // Fee structure
        registrationFees: b.registrationFees,
        admissionFees: b.admissionFees,
        annualFund: b.annualFund,
        monthlyFees: b.monthlyFees,
        transportFees: b.transportFees || undefined,
        // Late fee config
        dueDayOfMonth: b.dueDay,
        lateFeeAmount: b.lateFeeAmt,
        lateFeeFrequency: b.lateFeeFreq,
        // Personal details
        personalDetails: b.personal,
        // Payments
        payments,
        // Legacy (for backward compat)
        targetAmount: annualTotal,
        // New: profile photo placeholder for first two students per session
        photoUrl: isFirstOrSecondInSession ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.name)}` : undefined,
      });
    });
  });
  return students;
}

export function createSampleStaff(): Staff[] {
  const roles: Staff["role"][] = ["Teacher", "Teacher", "Administrative", "Bus Driver", "Support Staff", "Teacher", "Support Staff"];
  const names = ["Mr. Suresh Kumar", "Ms. Lakshmi Nair", "Mrs. Geeta Sharma", "Mr. Rajesh Driver", "Mr. Ramesh Singh", "Ms. Pooja Mathur", "Mr. Amit Gupta"];
  const salaries = [45000, 42000, 35000, 28000, 18000, 40000, 15000];
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  const staff: Staff[] = [];
  sessions.forEach((sessionId) => {
    roles.forEach((role, i) => {
      const id = generateId();
      const months = ["2024-04", "2024-05", "2024-06", "2024-07", "2024-08", "2024-09"];
      staff.push({
        id,
        sessionId,
        name: names[i],
        employeeId: `EMP-${sessionId.slice(-1)}-${100 + i}`,
        role,
        monthlySalary: salaries[i],
        subjectOrGrade: role === "Teacher" ? (i === 0 ? "Mathematics" : i === 1 ? "Science" : "English") : undefined,
        salaryPayments: months.map((month, mi) => ({
          id: generateId(),
          month,
          amount: salaries[i],
          status: mi < 4 ? "Paid" : mi === 4 ? "Partially Paid" : "Pending",
          paymentDate: mi < 4 ? `${month}-${5 + mi}` : undefined,
          method: "Bank Transfer",
        })),
      });
    });
  });
  return staff;
}

export function createSampleExpenses(): Expense[] {
  const categories: Expense["category"][] = ["Transportation", "Events", "Utilities", "Supplies", "Infrastructure", "Miscellaneous"];
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  const expenses: Expense[] = [];
  const entries = [
    { cat: 0, amount: 15000, desc: "Fuel", vendor: "Petrol Pump" },
    { cat: 0, amount: 8000, desc: "Bus maintenance", vendor: "Auto Care" },
    { cat: 1, amount: 25000, desc: "Annual day", vendor: "Event Co" },
    { cat: 1, amount: 12000, desc: "Sports day", vendor: "Sports Co" },
    { cat: 2, amount: 18000, desc: "Electricity", vendor: "State Board" },
    { cat: 2, amount: 5000, desc: "Internet", vendor: "ISP" },
    { cat: 3, amount: 22000, desc: "Stationery", vendor: "Book Store" },
    { cat: 3, amount: 35000, desc: "Books", vendor: "Publishers" },
    { cat: 4, amount: 40000, desc: "Building repair", vendor: "Contractor" },
    { cat: 5, amount: 5000, desc: "Misc", vendor: "General" },
  ];
  sessions.forEach((sessionId) => {
    entries.forEach((e, i) => {
      const d = new Date(2024, (i % 6), 1 + (i % 25));
      expenses.push({
        id: generateId(),
        sessionId,
        date: d.toISOString().slice(0, 10),
        amount: e.amount + (i * 500),
        category: categories[e.cat],
        description: e.desc,
        vendorPayee: e.vendor,
        paymentMethod: i % 2 === 0 ? "Bank Transfer" : "Cheque",
        tags: [],
      });
    });
    // Stock Purchase expenses (aligned with sample stocks)
    expenses.push({
      id: generateId(),
      sessionId,
      date: "2024-04-05",
      amount: 85000,
      category: "Stock Purchase",
      description: "Oxford University Press - English & Science textbooks",
      vendorPayee: "Oxford University Press",
      paymentMethod: "Bank Transfer",
      tags: [],
    });
    expenses.push({
      id: generateId(),
      sessionId,
      date: "2024-04-01",
      amount: 120000,
      category: "Stock Purchase",
      description: "NCERT Publications - textbooks",
      vendorPayee: "NCERT Publications",
      paymentMethod: "Bank Transfer",
      tags: [],
    });
    // Salary expenses (paid staff salaries)
    expenses.push({
      id: generateId(),
      sessionId,
      date: "2024-04-05",
      amount: 45000,
      category: "Salary",
      description: "Salary payment for Mr. Suresh Kumar - 2024-04",
      vendorPayee: "Mr. Suresh Kumar",
      paymentMethod: "Bank Transfer",
      tags: [],
    });
    expenses.push({
      id: generateId(),
      sessionId,
      date: "2024-04-05",
      amount: 42000,
      category: "Salary",
      description: "Salary payment for Ms. Lakshmi Nair - 2024-04",
      vendorPayee: "Ms. Lakshmi Nair",
      paymentMethod: "Bank Transfer",
      tags: [],
    });
    // Fixed Cost (rent) - one per session
    expenses.push({
      id: generateId(),
      sessionId,
      date: "2024-04-01",
      amount: 35000,
      category: "Fixed Cost",
      description: "Monthly rent - April 2024",
      vendorPayee: "Landlord",
      paymentMethod: "Bank Transfer",
      tags: [],
    });
  });
  return expenses;
}

export function createSampleStocks(): Stock[] {
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  const stocks: Stock[] = [];
  
  const stockTemplates = [
    {
      publisherName: "Oxford University Press",
      description: "English & Science textbooks for 2024-25",
      totalCreditAmount: 85000,
      purchaseDate: "2024-04-05",
      status: "open" as const,
      transactions: [
        { type: "sale" as const, amount: 12000, quantity: 40, description: "Class 1-3 English books sold", date: "2024-04-15" },
        { type: "sale" as const, amount: 18000, quantity: 60, description: "Class 4-6 Science books sold", date: "2024-05-10" },
        { type: "return" as const, amount: 3500, quantity: 10, description: "Damaged books returned", date: "2024-05-25" },
        { type: "sale" as const, amount: 15000, quantity: 50, description: "Class 7-9 books sold", date: "2024-06-20" },
      ],
    },
    {
      publisherName: "NCERT Publications",
      description: "NCERT textbooks for all classes",
      totalCreditAmount: 120000,
      purchaseDate: "2024-04-01",
      status: "open" as const,
      transactions: [
        { type: "sale" as const, amount: 25000, quantity: 100, description: "Primary section books sold", date: "2024-04-20" },
        { type: "sale" as const, amount: 35000, quantity: 120, description: "Middle school books sold", date: "2024-05-15" },
        { type: "sale" as const, amount: 20000, quantity: 80, description: "Senior section books sold", date: "2024-06-10" },
      ],
    },
    {
      publisherName: "Navneet Publishers",
      description: "Notebooks and workbooks bulk order",
      totalCreditAmount: 45000,
      purchaseDate: "2024-03-20",
      status: "cleared" as const,
      settledDate: "2024-07-15",
      settledAmount: 42000,
      transactions: [
        { type: "sale" as const, amount: 30000, quantity: 500, description: "Notebooks sold to students", date: "2024-04-10" },
        { type: "sale" as const, amount: 15000, quantity: 200, description: "Workbooks sold", date: "2024-05-05" },
        { type: "return" as const, amount: 3000, quantity: 50, description: "Defective notebooks returned", date: "2024-06-01" },
      ],
    },
    {
      publisherName: "Prachi Publications",
      description: "Hindi literature and grammar books",
      totalCreditAmount: 35000,
      purchaseDate: "2024-04-10",
      status: "open" as const,
      transactions: [
        { type: "sale" as const, amount: 8000, quantity: 30, description: "Class 1-5 Hindi books", date: "2024-04-25" },
        { type: "sale" as const, amount: 12000, quantity: 45, description: "Class 6-10 Hindi books", date: "2024-05-20" },
      ],
    },
  ];

  // Add stocks to first 3 sessions (to show variety)
  sessions.slice(0, 3).forEach((sessionId, si) => {
    stockTemplates.forEach((template, ti) => {
      // Skip some stocks for variety
      if (si > 0 && ti > 1) return;
      
      const transactions = template.transactions.map((t) => ({
        id: generateId(),
        ...t,
        receiptNumber: `STK-${sessionId.slice(-1)}-${1000 + si * 100 + ti * 10}`,
      }));

      stocks.push({
        id: generateId(),
        sessionId,
        publisherName: template.publisherName,
        description: template.description,
        purchaseDate: template.purchaseDate,
        totalCreditAmount: template.totalCreditAmount + (si * 5000), // Slight variation
        transactions,
        status: template.status,
        settledDate: template.settledDate,
        settledAmount: template.settledAmount,
        notes: si === 0 ? "Regular supplier - good terms" : undefined,
      });
    });
  });

  return stocks;
}

export function createSampleFixedCosts(): FixedMonthlyCost[] {
  const sessions = ["sess1", "sess2", "sess3", "sess4", "sess5"];
  const fixedCosts: FixedMonthlyCost[] = [];
  const templates: { name: string; amount: number; category: FixedMonthlyCost["category"] }[] = [
    { name: "Rent", amount: 35000, category: "Fixed Cost" },
    { name: "Internet", amount: 2500, category: "Utilities" },
    { name: "Security", amount: 5000, category: "Infrastructure" },
  ];
  sessions.forEach((sessionId) => {
    templates.forEach((t) => {
      fixedCosts.push({
        id: generateId(),
        sessionId,
        name: t.name,
        amount: t.amount,
        category: t.category,
        isActive: true,
      });
    });
  });
  return fixedCosts;
}
