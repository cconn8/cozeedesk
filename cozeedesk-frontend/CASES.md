Recommended Implementation Sequence:

  Phase 1: Static UI (Complete ✅)

  - Create UI components with sample data
  - Test user interactions (clicking, drawer opening/closing)
  - Ensure responsive design works

  Phase 2: Backend API (Next Steps)

  Cases API Endpoints Needed:
  // Backend API structure
  GET    /api/cases              // List all cases for tenant
  GET    /api/cases/:id          // Get specific case details
  POST   /api/cases              // Create new case
  PUT    /api/cases/:id          // Update case
  DELETE /api/cases/:id          // Delete case
  POST   /api/cases/:id/process  // Reprocess document

  Database Schema (MongoDB):
  // Cases Collection
  {
    _id: ObjectId,
    tenantId: ObjectId,           // Multi-tenant isolation
    title: String,
    type: String,                 // 'funeral', 'medical', 'legal', 'invoice'
    status: String,               // 'new', 'processing', 'completed'
    originalDocument: {
      filename: String,
      url: String,
      uploadedAt: Date
    },
    extractedData: {              // Flexible JSON structure
      [fieldName]: {
        value: String,
        confidence: Number,
        location: { x: Number, y: Number }  // For document coordinates
      }
    },
    createdAt: Date,
    updatedAt: Date,
    createdBy: ObjectId,          // User who created case
    lastModifiedBy: ObjectId
  }

  Phase 3: API Integration

  Replace sample data with real API calls:
  // In cases page
  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const response = await fetch('/api/cases');
        const cases = await response.json();
        setCases(cases);
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, []);

  Phase 4: Document Processing

  File Upload + OCR Integration:
  // New component: DocumentUpload
  async function handleFileUpload(file: File, caseType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', caseType);

    const response = await fetch('/api/cases/upload', {
      method: 'POST',
      body: formData
    });

    const newCase = await response.json();
    // Add to cases list and open drawer
  }

  ---
  5. Why This Approach Works

  For Learning:

  - Simple Components: Each component has one clear responsibility
  - Clear Data Flow: Easy to trace how data moves between components
  - No Complex State: Basic useState for local component state
  - TypeScript Benefits: Autocomplete and error checking without complexity

  For Scalability:

  - Component Separation: Table and drawer can be modified independently
  - Props Interface: Easy to add new features without breaking existing code
  - Sample Data: Can switch to real API without changing component logic
  - Responsive Design: Works on desktop and mobile

  For Production:

  - Error Handling: Loading and empty states handled
  - User Experience: Smooth animations and clear feedback
  - Accessibility: Proper ARIA labels and keyboard navigation
  - Performance: Only renders what's needed

  ---
  6. Next Steps

  1. Create Cases API endpoints in your NestJS backend
  2. Set up file upload handling for documents
  3. Integrate OpenAI for document processing
  4. Replace sample data with real API calls
  5. Add search and filtering functionality
  6. Implement action modules (Notes, Tasks, etc.)

  This UI foundation gives you a solid base to build the backend against, ensuring the frontend and backend work together
  seamlessly!
 
 
 
 
 1. What I Created

  CasesTable Component (/components/cases/CasesTable.tsx)

  - Purpose: Displays all cases in a searchable table format
  - Features: Search bar, status badges, formatted dates, "View" buttons
  - States: Loading state, empty state, populated table

  CaseDrawer Component (/components/cases/CaseDrawer.tsx)

  - Purpose: Side panel showing detailed case information
  - Features: Case overview, extracted data, action modules, original document view
  - Interaction: Slides in from right when case is selected

  Updated Cases Page (/app/cases/page.tsx)

  - Purpose: Main page that orchestrates the components
  - Features: State management for drawer, sample data, component coordination

  ---
  2. Component Architecture Explained

  Simple Data Flow:

  Cases Page (State Management)
  ├── CasesTable (Display + Actions)
  │   └── Triggers: onViewCase(caseId)
  └── CaseDrawer (Details Display)
      └── Receives: case data + open state

  Key TypeScript Concepts Used:

  Interface Definitions:
  interface Case {
    id: string;
    title: string;
    type: 'funeral' | 'medical' | 'legal' | 'invoice';  // Union type - only these values allowed
    status: 'new' | 'processing' | 'completed';
    createdAt: string;
    updatedAt: string;
  }

  Function Props Pattern:
  interface CasesTableProps {
    cases: Case[];                          // Array of Case objects
    onViewCase: (caseId: string) => void;   // Function that takes caseId and returns nothing
    loading?: boolean;                      // Optional boolean
  }

  State Management:
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  // selectedCaseId can be a string OR null
  // setSelectedCaseId is a function to update this value

  ---
  3. How the Components Work

  CasesTable Features:

  1. Status Badges: Different colors for each status
  function getStatusColor(status: string): string {
    if (status === 'new') return 'bg-blue-100 text-blue-800';
    if (status === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }

  2. Date Formatting: Converts ISO dates to readable format
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  3. Conditional Rendering: Shows different UI based on data state
  if (loading) return <LoadingState />;
  if (cases.length === 0) return <EmptyState />;
  return <PopulatedTable />;

  CaseDrawer Features:

  1. Overlay Pattern: Full-screen overlay with side panel
  <div className="fixed inset-0 overflow-hidden z-50">
    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
    <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white">
      {/* Drawer content */}
    </div>
  </div>

  2. Extracted Data Display: Shows AI-extracted fields with confidence scores
  {Object.entries(caseData.extractedData).map(([key, data]) => (
    <div key={key}>
      <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>  {/* Convert camelCase to readable */}
      <p>{data.value}</p>
      {data.confidence && <span>{Math.round(data.confidence * 100)}% confident</span>}
    </div>
  ))}

  ---
  4. Implementation Approach & Backend Requirements

  Recommended Implementation Sequence:

  Phase 1: Static UI (Complete ✅)

  - Create UI components with sample data
  - Test user interactions (clicking, drawer opening/closing)
  - Ensure responsive design works

  Phase 2: Backend API (Next Steps)

  Cases API Endpoints Needed:
  // Backend API structure
  GET    /api/cases              // List all cases for tenant
  GET    /api/cases/:id          // Get specific case details
  POST   /api/cases              // Create new case
  PUT    /api/cases/:id          // Update case
  DELETE /api/cases/:id          // Delete case
  POST   /api/cases/:id/process  // Reprocess document

  Database Schema (MongoDB):
  // Cases Collection
  {
    _id: ObjectId,
    tenantId: ObjectId,           // Multi-tenant isolation
    title: String,
    type: String,                 // 'funeral', 'medical', 'legal', 'invoice'
    status: String,               // 'new', 'processing', 'completed'
    originalDocument: {
      filename: String,
      url: String,
      uploadedAt: Date
    },
    extractedData: {              // Flexible JSON structure
      [fieldName]: {
        value: String,
        confidence: Number,
        location: { x: Number, y: Number }  // For document coordinates
      }
    },
    createdAt: Date,
    updatedAt: Date,
    createdBy: ObjectId,          // User who created case
    lastModifiedBy: ObjectId
  }

  Phase 3: API Integration

  Replace sample data with real API calls:
  // In cases page
  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const response = await fetch('/api/cases');
        const cases = await response.json();
        setCases(cases);
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, []);

  Phase 4: Document Processing

  File Upload + OCR Integration:
  // New component: DocumentUpload
  async function handleFileUpload(file: File, caseType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', caseType);

    const response = await fetch('/api/cases/upload', {
      method: 'POST',
      body: formData
    });

    const newCase = await response.json();
    // Add to cases list and open drawer
  }

  ---
  5. Why This Approach Works

  For Learning:

  - Simple Components: Each component has one clear responsibility
  - Clear Data Flow: Easy to trace how data moves between components
  - No Complex State: Basic useState for local component state
  - TypeScript Benefits: Autocomplete and error checking without complexity

  For Scalability:

  - Component Separation: Table and drawer can be modified independently
  - Props Interface: Easy to add new features without breaking existing code
  - Sample Data: Can switch to real API without changing component logic
  - Responsive Design: Works on desktop and mobile

  For Production:

  - Error Handling: Loading and empty states handled
  - User Experience: Smooth animations and clear feedback
  - Accessibility: Proper ARIA labels and keyboard navigation
  - Performance: Only renders what's needed

  ---
  6. Next Steps

  1. Create Cases API endpoints in your NestJS backend
  2. Set up file upload handling for documents
  3. Integrate OpenAI for document processing
  4. Replace sample data with real API calls
  5. Add search and filtering functionality
  6. Implement action modules (Notes, Tasks, etc.)

