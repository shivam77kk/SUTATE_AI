const questionBank = {
  DBMS: [
    { question: "What is normalization in DBMS?", options: ["Adding redundancy", "Removing redundancy and anomalies", "Creating indexes", "Backing up data"], correctIndex: 1, explanation: "Normalization organizes data to reduce redundancy." },
    { question: "Which normal form deals with transitive dependency?", options: ["1NF", "2NF", "3NF", "BCNF"], correctIndex: 2, explanation: "3NF eliminates transitive dependencies." },
    { question: "What does ACID stand for?", options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Index, Data", "Add, Create, Insert, Delete", "Attribute, Column, Index, Domain"], correctIndex: 0, explanation: "ACID ensures reliable database transactions." },
    { question: "Which SQL command removes a table entirely?", options: ["DELETE", "REMOVE", "DROP", "TRUNCATE"], correctIndex: 2, explanation: "DROP TABLE removes the table structure and data." },
    { question: "What is a foreign key?", options: ["A primary key copy", "A key referencing a primary key in another table", "An encrypted key", "A composite key"], correctIndex: 1, explanation: "A foreign key links two tables." },
    { question: "What is a deadlock in DBMS?", options: ["A fast query", "Two transactions waiting for each other indefinitely", "A type of index", "A backup strategy"], correctIndex: 1, explanation: "Deadlock occurs when transactions block each other permanently." },
    { question: "Which join returns all rows from both tables?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], correctIndex: 3, explanation: "FULL OUTER JOIN returns all rows with NULLs where no match." },
    { question: "What is an ER diagram?", options: ["A SQL query tool", "A visual model of database structure", "An encryption diagram", "A performance test"], correctIndex: 1, explanation: "ER diagrams represent entities and relationships." },
    { question: "What does GROUP BY do in SQL?", options: ["Sorts rows", "Groups rows for aggregate functions", "Joins tables", "Filters rows"], correctIndex: 1, explanation: "GROUP BY groups rows for aggregate calculations." },
    { question: "What is a stored procedure?", options: ["A temporary table", "Precompiled SQL stored in database", "A type of index", "A backup method"], correctIndex: 1, explanation: "Stored procedures are reusable precompiled SQL." },
    { question: "What is referential integrity?", options: ["Data encryption", "Foreign keys referencing valid primary keys", "Query optimization", "Data compression"], correctIndex: 1, explanation: "Referential integrity ensures consistent table relationships." },
    { question: "What is a view in SQL?", options: ["A physical table", "A virtual table from a query", "A stored procedure", "A trigger"], correctIndex: 1, explanation: "A view is a virtual table created from SELECT." },
  ],
  OS: [
    { question: "What is a process in an OS?", options: ["A file on disk", "A program in execution", "A hardware component", "A network protocol"], correctIndex: 1, explanation: "A process is a program being executed by the CPU." },
    { question: "Which scheduling algorithm may cause starvation?", options: ["FCFS", "Round Robin", "SJF", "All of these"], correctIndex: 2, explanation: "SJF can starve longer processes." },
    { question: "What is virtual memory?", options: ["Extra RAM", "Using disk space as extended memory", "Cache memory", "ROM storage"], correctIndex: 1, explanation: "Virtual memory uses disk to simulate additional RAM." },
    { question: "What causes a race condition?", options: ["Fast CPU", "Multiple processes accessing shared data without sync", "Too much memory", "Slow disk"], correctIndex: 1, explanation: "Race conditions occur without proper synchronization." },
    { question: "What is thrashing?", options: ["Fast processing", "Excessive page faults degrading performance", "Memory leak", "CPU overheating"], correctIndex: 1, explanation: "Thrashing means more time paging than executing." },
    { question: "What is a semaphore?", options: ["A type of memory", "A synchronization primitive", "A CPU register", "A file system"], correctIndex: 1, explanation: "Semaphores control access to shared resources." },
    { question: "What does a page table do?", options: ["Store files", "Map virtual to physical addresses", "Schedule processes", "Manage I/O"], correctIndex: 1, explanation: "Page tables translate virtual to physical addresses." },
    { question: "Which is NOT a process state?", options: ["Ready", "Running", "Blocked", "Compiled"], correctIndex: 3, explanation: "Compiled is not a process state." },
    { question: "What is a context switch?", options: ["Changing user account", "Saving/loading process state when switching", "Restarting OS", "Installing software"], correctIndex: 1, explanation: "Context switching saves current and loads another process." },
    { question: "What is the Banker's algorithm for?", options: ["Banking transactions", "Deadlock avoidance", "Memory allocation", "File management"], correctIndex: 1, explanation: "Banker's algorithm prevents deadlock." },
    { question: "What is demand paging?", options: ["Loading all pages at once", "Loading pages only when needed", "Deleting unused pages", "Compressing pages"], correctIndex: 1, explanation: "Demand paging loads pages only when accessed." },
    { question: "What does the kernel manage?", options: ["Only UI", "Hardware, memory, and processes", "Only networking", "Only printers"], correctIndex: 1, explanation: "The kernel manages core system resources." },
  ],
  CN: [
    { question: "What layer does HTTP operate on?", options: ["Network", "Transport", "Application", "Data Link"], correctIndex: 2, explanation: "HTTP is an Application layer protocol." },
    { question: "What does DNS do?", options: ["Encrypt data", "Translate domain names to IPs", "Route packets", "Compress files"], correctIndex: 1, explanation: "DNS resolves domain names to IP addresses." },
    { question: "Which protocol provides reliable transfer?", options: ["UDP", "TCP", "ICMP", "ARP"], correctIndex: 1, explanation: "TCP ensures reliable delivery." },
    { question: "What is a subnet mask?", options: ["Encryption tool", "Divides network into sub-networks", "Speed booster", "Compression tool"], correctIndex: 1, explanation: "Subnet masks define network and host portions." },
    { question: "How many layers in the OSI model?", options: ["4", "5", "7", "6"], correctIndex: 2, explanation: "The OSI model has 7 layers." },
    { question: "What device operates at the Network layer?", options: ["Hub", "Switch", "Router", "Repeater"], correctIndex: 2, explanation: "Routers operate at Layer 3." },
    { question: "What is ARP used for?", options: ["Routing", "Resolving IP to MAC addresses", "Encryption", "Compression"], correctIndex: 1, explanation: "ARP maps IP to MAC addresses." },
    { question: "TCP vs UDP difference?", options: ["TCP is faster", "UDP is reliable", "TCP is connection-oriented, UDP connectionless", "No difference"], correctIndex: 2, explanation: "TCP is connection-oriented; UDP is connectionless." },
    { question: "What port does HTTPS use?", options: ["80", "443", "21", "25"], correctIndex: 1, explanation: "HTTPS uses port 443." },
    { question: "What is NAT?", options: ["A cable type", "Translates private IPs to public IPs", "A DNS service", "A routing algorithm"], correctIndex: 1, explanation: "NAT lets multiple devices share one public IP." },
    { question: "What is a MAC address?", options: ["An IP address", "A unique hardware identifier", "A software license", "A routing table"], correctIndex: 1, explanation: "MAC addresses are unique hardware identifiers." },
    { question: "What is DHCP?", options: ["A routing protocol", "Auto-assigns IP addresses", "A firewall", "A DNS server"], correctIndex: 1, explanation: "DHCP dynamically assigns IP addresses." },
  ],
  DSA: [
    { question: "Time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], correctIndex: 2, explanation: "Binary search is O(log n)." },
    { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Array", "Linked List"], correctIndex: 1, explanation: "Stack follows Last In First Out." },
    { question: "Worst-case complexity of quicksort?", options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], correctIndex: 2, explanation: "Quicksort degrades to O(n²) with bad pivots." },
    { question: "Which traversal visits root first?", options: ["Inorder", "Preorder", "Postorder", "Level order"], correctIndex: 1, explanation: "Preorder visits root before subtrees." },
    { question: "What is a hash collision?", options: ["Memory overflow", "Two keys mapping to same index", "Sorting error", "Stack overflow"], correctIndex: 1, explanation: "Collisions occur when keys share hash values." },
    { question: "BFS uses which data structure?", options: ["Stack", "Queue", "Heap", "Array"], correctIndex: 1, explanation: "BFS uses a queue for level-by-level traversal." },
    { question: "What is dynamic programming?", options: ["Writing code dynamically", "Solving overlapping subproblems", "A recursion type", "Memory management"], correctIndex: 1, explanation: "DP stores results of overlapping subproblems." },
    { question: "Space complexity of merge sort?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctIndex: 2, explanation: "Merge sort needs O(n) extra space." },
    { question: "Which sorting algorithm is stable?", options: ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"], correctIndex: 2, explanation: "Merge Sort preserves relative order of equal elements." },
    { question: "What is a priority queue implemented with?", options: ["Array", "Linked List", "Heap", "Stack"], correctIndex: 2, explanation: "Heaps efficiently support priority queue operations." },
    { question: "What is a graph cycle?", options: ["A sorted graph", "Path starting and ending at same vertex", "A disconnected graph", "A weighted edge"], correctIndex: 1, explanation: "A cycle starts and ends at the same vertex." },
    { question: "What is a balanced BST?", options: ["Equal values tree", "Height difference between subtrees ≤ 1", "No leaves tree", "Linear structure"], correctIndex: 1, explanation: "Balanced BSTs maintain O(log n) operations." },
  ],
  Maths: [
    { question: "What is the derivative of e^x?", options: ["x·e^(x-1)", "e^x", "ln(x)", "1/x"], correctIndex: 1, explanation: "The derivative of e^x is e^x." },
    { question: "Value of lim(x→0) sin(x)/x?", options: ["0", "1", "∞", "Undefined"], correctIndex: 1, explanation: "This fundamental limit equals 1." },
    { question: "What is matrix rank?", options: ["Its determinant", "Number of linearly independent rows", "Number of elements", "Trace"], correctIndex: 1, explanation: "Rank is max linearly independent rows/columns." },
    { question: "Laplace transform of 1?", options: ["s", "1/s", "s²", "1"], correctIndex: 1, explanation: "L{1} = 1/s." },
    { question: "What is a singular matrix?", options: ["All 1s matrix", "Determinant is zero", "Diagonal matrix", "Identity matrix"], correctIndex: 1, explanation: "Singular matrices have zero determinant." },
    { question: "Integral of 1/x?", options: ["x²", "ln|x| + C", "e^x", "1/x²"], correctIndex: 1, explanation: "∫(1/x)dx = ln|x| + C." },
    { question: "What is Bayes' theorem for?", options: ["Integration", "Updating probability with new evidence", "Matrix ops", "Differentiation"], correctIndex: 1, explanation: "Bayes' theorem calculates conditional probability." },
    { question: "What is an eigenvalue?", options: ["Largest element", "Scalar λ where Av = λv", "Determinant", "Trace"], correctIndex: 1, explanation: "Eigenvalue satisfies Av = λv." },
    { question: "Taylor series is used for?", options: ["Sorting", "Approximating functions as polynomials", "Solving linear equations", "Graphing"], correctIndex: 1, explanation: "Taylor series approximate functions as polynomial sums." },
    { question: "Probability of heads in fair coin?", options: ["0.25", "0.5", "0.75", "1"], correctIndex: 1, explanation: "Fair coin has 0.5 probability for each side." },
  ],
  "Computer Architecture": [
    { question: "What is the function of the ALU?", options: ["Memory storage", "Performs arithmetic and logical operations", "Controls I/O", "Manages cache"], correctIndex: 1, explanation: "ALU performs all arithmetic and logical computations." },
    { question: "What is pipelining in CPU design?", options: ["Parallel memory access", "Overlapping instruction execution stages", "Multi-core processing", "Cache management"], correctIndex: 1, explanation: "Pipelining overlaps stages of multiple instructions." },
    { question: "What is a cache miss?", options: ["Successful data retrieval", "Data not found in cache", "Cache overflow", "Cache corruption"], correctIndex: 1, explanation: "Cache miss occurs when requested data isn't in cache." },
    { question: "What does the program counter do?", options: ["Counts programs", "Holds address of next instruction", "Counts clock cycles", "Manages memory"], correctIndex: 1, explanation: "PC stores the address of the next instruction to execute." },
    { question: "What is RISC architecture?", options: ["Complex instruction set", "Reduced instruction set for efficiency", "Random instruction set", "Recursive instruction set"], correctIndex: 1, explanation: "RISC uses simple instructions for faster execution." },
    { question: "What is a bus in computer architecture?", options: ["A software driver", "Communication pathway between components", "A type of memory", "An output device"], correctIndex: 1, explanation: "A bus transfers data between CPU, memory, and I/O." },
    { question: "What is Von Neumann architecture?", options: ["Separate data and instruction memory", "Shared memory for data and instructions", "No memory architecture", "Distributed computing"], correctIndex: 1, explanation: "Von Neumann uses single memory for both data and instructions." },
    { question: "What is an instruction register?", options: ["Stores data permanently", "Holds the current instruction being executed", "A type of RAM", "An output register"], correctIndex: 1, explanation: "IR holds the instruction currently being decoded/executed." },
    { question: "What is cache coherence?", options: ["Cache cleaning", "Ensuring all caches have consistent data", "Cache encryption", "Cache compression"], correctIndex: 1, explanation: "Cache coherence ensures uniform data across multi-level caches." },
    { question: "What is the purpose of a control unit?", options: ["Performs calculations", "Directs the operation of the processor", "Stores data", "Manages network"], correctIndex: 1, explanation: "The CU coordinates and controls CPU operations." },
    { question: "What is CISC?", options: ["Simple instructions only", "Complex instruction set computing", "Cache instruction set", "Core instruction set"], correctIndex: 1, explanation: "CISC uses complex multi-step instructions." },
    { question: "What is memory hierarchy?", options: ["Random memory layout", "Organized levels from fast/small to slow/large", "Only RAM types", "Cloud storage levels"], correctIndex: 1, explanation: "Memory hierarchy balances speed, size, and cost." },
  ],
  "Web Technology": [
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctIndex: 0, explanation: "HTML is HyperText Markup Language." },
    { question: "What is CSS used for?", options: ["Server logic", "Styling and layout of web pages", "Database queries", "Network security"], correctIndex: 1, explanation: "CSS controls the visual presentation of HTML." },
    { question: "What is the DOM?", options: ["A database model", "Document Object Model for page structure", "A server framework", "A CSS property"], correctIndex: 1, explanation: "DOM represents the page as a tree of objects." },
    { question: "What does REST stand for?", options: ["Representational State Transfer", "Remote Execution Server Technology", "Rapid Enterprise System Transfer", "Responsive State Technology"], correctIndex: 0, explanation: "REST is an architectural style for APIs." },
    { question: "What is AJAX used for?", options: ["Styling pages", "Asynchronous data exchange without page reload", "Database management", "Server deployment"], correctIndex: 1, explanation: "AJAX enables async communication with the server." },
    { question: "What is a cookie in web development?", options: ["A virus", "Small data stored in the browser", "A server-side script", "A CSS framework"], correctIndex: 1, explanation: "Cookies store small pieces of data in the browser." },
    { question: "What HTTP method is used to update data?", options: ["GET", "POST", "PUT", "DELETE"], correctIndex: 2, explanation: "PUT is used to update existing resources." },
    { question: "What is responsive design?", options: ["Fast loading pages", "Design that adapts to different screen sizes", "Server-side rendering", "Database optimization"], correctIndex: 1, explanation: "Responsive design adapts layout to different devices." },
    { question: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Standard Object Naming", "JavaScript Online Network", "Java Serialized Object Node"], correctIndex: 0, explanation: "JSON is a lightweight data interchange format." },
    { question: "What is a web socket?", options: ["A CSS property", "Full-duplex communication over TCP", "A database connection", "A file upload tool"], correctIndex: 1, explanation: "WebSockets enable two-way real-time communication." },
  ],
  "Software Engineering": [
    { question: "What is the SDLC?", options: ["A programming language", "Software Development Life Cycle", "A testing tool", "A database system"], correctIndex: 1, explanation: "SDLC is the process of planning, creating, and maintaining software." },
    { question: "What is Agile methodology?", options: ["Waterfall approach", "Iterative and incremental development", "Only documentation", "Only testing"], correctIndex: 1, explanation: "Agile delivers software in short iterative cycles." },
    { question: "What is a use case diagram?", options: ["Code flowchart", "Shows user interactions with a system", "Database schema", "Network topology"], correctIndex: 1, explanation: "Use case diagrams model user-system interactions." },
    { question: "What is unit testing?", options: ["Testing entire system", "Testing individual components in isolation", "User acceptance testing", "Performance testing"], correctIndex: 1, explanation: "Unit tests verify individual functions or methods." },
    { question: "What is coupling in software design?", options: ["Code formatting", "Degree of interdependence between modules", "Testing coverage", "Documentation quality"], correctIndex: 1, explanation: "Low coupling means modules are independent." },
    { question: "What is a design pattern?", options: ["UI color scheme", "Reusable solution to common software problems", "Testing strategy", "Database design"], correctIndex: 1, explanation: "Design patterns are proven solutions to recurring problems." },
    { question: "What is version control?", options: ["Updating software versions", "Tracking changes in source code", "Testing versions", "Deploying updates"], correctIndex: 1, explanation: "Version control tracks and manages code changes over time." },
    { question: "What is refactoring?", options: ["Adding features", "Improving code structure without changing behavior", "Removing bugs", "Writing documentation"], correctIndex: 1, explanation: "Refactoring improves internal code quality." },
    { question: "What is the waterfall model?", options: ["Iterative process", "Sequential linear development phases", "Spiral approach", "Prototype-based"], correctIndex: 1, explanation: "Waterfall follows strict sequential phases." },
    { question: "What is regression testing?", options: ["Testing new features", "Re-testing after changes to ensure no new bugs", "Load testing", "Security testing"], correctIndex: 1, explanation: "Regression testing ensures changes don't break existing functionality." },
  ],
  "Machine Learning": [
    { question: "What is supervised learning?", options: ["Learning without labels", "Learning from labeled training data", "Reinforcement learning", "Unsupervised clustering"], correctIndex: 1, explanation: "Supervised learning uses labeled data to train models." },
    { question: "What is overfitting?", options: ["Model too simple", "Model memorizes training data, fails on new data", "Underfitting", "Perfect accuracy"], correctIndex: 1, explanation: "Overfitting means poor generalization to unseen data." },
    { question: "What is a neural network?", options: ["A computer network", "Layers of interconnected nodes mimicking brain", "A database", "An algorithm"], correctIndex: 1, explanation: "Neural networks are inspired by biological neurons." },
    { question: "What is gradient descent?", options: ["A sorting algorithm", "Optimization algorithm minimizing loss function", "A search algorithm", "A classification method"], correctIndex: 1, explanation: "Gradient descent iteratively minimizes the error." },
    { question: "What does CNN stand for?", options: ["Computer Neural Network", "Convolutional Neural Network", "Connected Node Network", "Core Neural Net"], correctIndex: 1, explanation: "CNNs are specialized for image processing." },
    { question: "What is the purpose of a validation set?", options: ["Training the model", "Tuning hyperparameters and preventing overfitting", "Final testing", "Data cleaning"], correctIndex: 1, explanation: "Validation sets help tune models without using test data." },
    { question: "What is K-means?", options: ["A regression method", "An unsupervised clustering algorithm", "A neural network", "A decision tree"], correctIndex: 1, explanation: "K-means groups data into K clusters." },
    { question: "What is a confusion matrix?", options: ["A random matrix", "Table showing prediction vs actual results", "A weight matrix", "An input matrix"], correctIndex: 1, explanation: "Confusion matrices show TP, FP, TN, FN counts." },
    { question: "What is transfer learning?", options: ["Moving data between databases", "Using a pre-trained model for new tasks", "Transferring files", "Data migration"], correctIndex: 1, explanation: "Transfer learning reuses knowledge from one task to another." },
    { question: "What is feature engineering?", options: ["Building features in software", "Creating relevant input variables for ML models", "Hardware design", "Network configuration"], correctIndex: 1, explanation: "Feature engineering creates informative inputs for models." },
  ],
};

const genericPool = [
  { question: "Which approach breaks a problem into smaller subproblems?", options: ["Brute force", "Divide and conquer", "Greedy", "Random"], correctIndex: 1, explanation: "Divide and conquer splits, solves, and combines." },
  { question: "What is abstraction?", options: ["Making things complex", "Hiding details, showing essentials", "Deleting code", "Copying code"], correctIndex: 1, explanation: "Abstraction simplifies by exposing only necessary details." },
  { question: "What is an algorithm?", options: ["A language", "Step-by-step procedure to solve a problem", "Hardware", "A database"], correctIndex: 1, explanation: "An algorithm is a finite set of instructions." },
  { question: "What is recursion?", options: ["A loop", "A function calling itself", "A data type", "Error handling"], correctIndex: 1, explanation: "Recursion calls itself with smaller inputs." },
  { question: "What is Big-O notation?", options: ["Variable naming", "Describing algorithm efficiency", "Documentation", "Database design"], correctIndex: 1, explanation: "Big-O describes upper bound complexity." },
];

export function getRandomQuestions(subject, count = 5) {
  const subjectLower = subject.toLowerCase().trim();
  let pool = null;

  // Direct match
  for (const [key, questions] of Object.entries(questionBank)) {
    if (key.toLowerCase() === subjectLower) { pool = questions; break; }
  }

  // Partial match
  if (!pool) {
    for (const [key, questions] of Object.entries(questionBank)) {
      const kl = key.toLowerCase();
      if (subjectLower.includes(kl) || kl.includes(subjectLower)) { pool = questions; break; }
    }
  }

  // Alias match
  if (!pool) {
    const aliases = {
      'database': 'DBMS', 'sql': 'DBMS', 'mysql': 'DBMS', 'mongodb': 'DBMS', 'rdbms': 'DBMS',
      'operating system': 'OS', 'linux': 'OS', 'windows': 'OS', 'unix': 'OS',
      'computer network': 'CN', 'networking': 'CN', 'network': 'CN', 'networks': 'CN', 'tcp': 'CN', 'ip': 'CN',
      'data structure': 'DSA', 'algorithm': 'DSA', 'data structures': 'DSA', 'algorithms': 'DSA',
      'mathematics': 'Maths', 'math': 'Maths', 'calculus': 'Maths', 'linear algebra': 'Maths', 'discrete': 'Maths', 'probability': 'Maths',
      'coa': 'Computer Architecture', 'architecture': 'Computer Architecture', 'cpu': 'Computer Architecture', 'processor': 'Computer Architecture', 'microprocessor': 'Computer Architecture',
      'web': 'Web Technology', 'html': 'Web Technology', 'css': 'Web Technology', 'javascript': 'Web Technology', 'react': 'Web Technology', 'frontend': 'Web Technology',
      'se': 'Software Engineering', 'software': 'Software Engineering', 'sdlc': 'Software Engineering', 'agile': 'Software Engineering',
      'ml': 'Machine Learning', 'ai': 'Machine Learning', 'deep learning': 'Machine Learning', 'artificial intelligence': 'Machine Learning', 'neural': 'Machine Learning',
    };
    for (const [alias, bankKey] of Object.entries(aliases)) {
      if (subjectLower.includes(alias) || alias.includes(subjectLower)) {
        pool = questionBank[bankKey];
        break;
      }
    }
  }

  if (!pool) pool = genericPool;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default questionBank;
