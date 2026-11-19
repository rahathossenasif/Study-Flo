import { StudyFlowState } from '../types/studyflow';

function daysAgoIso(daysAgo: number, hour = 15): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
}

function daysFromNowDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function createSeedState(): StudyFlowState {
  const todayStr = new Date().toISOString().slice(0, 10);

  return {
    profile: {
      name: 'Learner',
      tagline: 'Plan • Focus • Learn • Grow',
      academicTrack: 'STEM & Computer Science',
      institution: '',
      institutionType: 'college',
      classOrYear: '',
      department: 'Science',
      studentId: '',
      sectionOrBatch: '',
      bio: 'Building consistent daily study habits and mastering every chapter step by step.',
      avatarColor: 'purple',
      dailyGoalMinutes: 120,
      weeklyGoalHours: 14,
      streakDays: 12,
      pomodoroFocusMin: 25,
      pomodoroShortBreakMin: 5,
      pomodoroLongBreakMin: 15,
      soundAlertsEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
      language: 'en',
      myStatus: 'studying',
      firebaseConfigJson: '',
    },
    subjects: [
      {
        id: 'sub-math',
        name: 'Mathematics',
        code: 'MATH 204',
        accent: 'purple',
        weeklyGoalHours: 5,
        chapters: [
          {
            id: 'ch-math-1',
            title: 'Chapter 1: Linear Algebra',
            deadline: daysFromNowDate(3),
            priority: 'high',
            topics: [
              { id: 't-m1', title: 'Matrix Transformations & Determinants', completed: true, priority: 'high', deadline: daysFromNowDate(1) },
              { id: 't-m2', title: 'Eigenvalues & Eigenvectors', completed: true, priority: 'high', deadline: daysFromNowDate(2) },
              { id: 't-m3', title: 'Orthogonal Projections', completed: true, priority: 'medium', deadline: daysFromNowDate(3) },
            ],
          },
          {
            id: 'ch-math-2',
            title: 'Chapter 2: Analytic Geometry',
            deadline: daysFromNowDate(5),
            priority: 'high',
            topics: [
              { id: 't-m4', title: 'Triangles & Trigonometric Ratios', completed: true, priority: 'medium', deadline: daysFromNowDate(2) },
              { id: 't-m5', title: 'Coordinate Geometry & Conics', completed: true, priority: 'high', deadline: daysFromNowDate(4) },
              { id: 't-m6', title: 'Vector Spaces & Cross Products', completed: false, priority: 'high', deadline: daysFromNowDate(5) },
            ],
          },
          {
            id: 'ch-math-3',
            title: 'Chapter 3: Multivariable Calculus',
            deadline: daysFromNowDate(11),
            priority: 'medium',
            topics: [
              { id: 't-m7', title: 'Partial Derivatives & Gradients', completed: true, priority: 'medium', deadline: daysFromNowDate(7) },
              { id: 't-m8', title: 'Multiple Integrals in Polar Coordinates', completed: false, priority: 'low', deadline: daysFromNowDate(11) },
            ],
          },
        ],
      },
      {
        id: 'sub-phys',
        name: 'Physics',
        code: 'PHYS 180',
        accent: 'cyan',
        weeklyGoalHours: 5,
        chapters: [
          {
            id: 'ch-phys-1',
            title: 'Chapter 1: Electromagnetism',
            deadline: daysFromNowDate(4),
            priority: 'high',
            topics: [
              { id: 't-p1', title: "Gauss's Law & Electric Flux", completed: true, priority: 'high', deadline: daysFromNowDate(1) },
              { id: 't-p2', title: "Faraday's Law of Induction", completed: true, priority: 'high', deadline: daysFromNowDate(3) },
              { id: 't-p3', title: "Maxwell's Equations Overview", completed: false, priority: 'high', deadline: daysFromNowDate(4) },
            ],
          },
          {
            id: 'ch-phys-2',
            title: 'Chapter 2: Quantum Foundations',
            deadline: daysFromNowDate(9),
            priority: 'medium',
            topics: [
              { id: 't-p4', title: 'Wave-Particle Duality & Photoelectric Effect', completed: true, priority: 'medium', deadline: daysFromNowDate(6) },
              { id: 't-p5', title: 'Schrödinger Equation in 1D Wells', completed: false, priority: 'medium', deadline: daysFromNowDate(9) },
            ],
          },
        ],
      },
      {
        id: 'sub-cs',
        name: 'Computer Science',
        code: 'CS 310',
        accent: 'amber',
        weeklyGoalHours: 5,
        chapters: [
          {
            id: 'ch-cs-1',
            title: 'Chapter 1: Graph Algorithms',
            deadline: daysFromNowDate(2),
            priority: 'high',
            topics: [
              { id: 't-c1', title: 'BFS, DFS & Topological Sort', completed: true, priority: 'high', deadline: daysFromNowDate(1) },
              { id: 't-c2', title: "Dijkstra & Bellman-Ford Shortest Paths", completed: true, priority: 'high', deadline: daysFromNowDate(2) },
              { id: 't-c3', title: 'Minimum Spanning Trees (Kruskal & Prim)', completed: true, priority: 'medium', deadline: daysFromNowDate(2) },
            ],
          },
          {
            id: 'ch-cs-2',
            title: 'Chapter 2: Dynamic Programming',
            deadline: daysFromNowDate(6),
            priority: 'high',
            topics: [
              { id: 't-c4', title: 'Memoization vs Tabulation Patterns', completed: true, priority: 'high', deadline: daysFromNowDate(4) },
              { id: 't-c5', title: 'Knapsack & Sequence Alignment', completed: false, priority: 'high', deadline: daysFromNowDate(6) },
            ],
          },
        ],
      },
    ],
    sessions: [
      { id: 'ses-1', subjectId: 'sub-math', mode: 'pomodoro', durationMinutes: 50, completedAt: daysAgoIso(0, 9), label: 'Coordinate Geometry Practice' },
      { id: 'ses-2', subjectId: 'sub-cs', mode: 'pomodoro', durationMinutes: 75, completedAt: daysAgoIso(0, 14), label: 'Dynamic Programming Drills' },
      { id: 'ses-3', subjectId: 'sub-phys', mode: 'custom', durationMinutes: 60, completedAt: daysAgoIso(1, 18), label: "Faraday's Law Problem Set" },
      { id: 'ses-4', subjectId: 'sub-math', mode: 'pomodoro', durationMinutes: 90, completedAt: daysAgoIso(2, 16), label: 'Eigenvalues & Vectors' },
      { id: 'ses-5', subjectId: 'sub-cs', mode: 'pomodoro', durationMinutes: 110, completedAt: daysAgoIso(3, 11), label: 'Graph Theory Implementation' },
      { id: 'ses-6', subjectId: 'sub-phys', mode: 'stopwatch', durationMinutes: 85, completedAt: daysAgoIso(4, 19), label: 'Quantum Mechanics Reading' },
      { id: 'ses-7', subjectId: 'sub-math', mode: 'pomodoro', durationMinutes: 70, completedAt: daysAgoIso(5, 10), label: 'Calculus Integration Review' },
      { id: 'ses-8', subjectId: 'sub-cs', mode: 'pomodoro', durationMinutes: 85, completedAt: daysAgoIso(6, 15), label: 'Shortest Path Benchmarks' },
    ],
    decks: [
      {
        id: 'deck-sci',
        title: 'Physics & Core Science',
        subjectId: 'sub-phys',
        description: 'Key physical laws, quantum principles, and bio-energetic mechanisms.',
        accent: 'purple',
      },
      {
        id: 'deck-math',
        title: 'Calculus & Linear Algebra',
        subjectId: 'sub-math',
        description: 'Essential theorems, integration rules, and vector identities.',
        accent: 'cyan',
      },
      {
        id: 'deck-cs',
        title: 'Algorithms & Complexity',
        subjectId: 'sub-cs',
        description: 'Big-O bounds, graph traversal invariants, and DP recurrences.',
        accent: 'amber',
      },
    ],
    flashcards: [
      {
        id: 'fc-1',
        deckId: 'deck-sci',
        question: 'What is photosynthesis and its core balanced chemical equation?',
        answer: 'The process by which photoautotrophs convert light energy into chemical energy (glucose): 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
        hint: 'Takes place in chloroplasts across light-dependent reactions and the Calvin cycle.',
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        nextReviewAt: daysAgoIso(1),
      },
      {
        id: 'fc-2',
        deckId: 'deck-sci',
        question: "State Faraday's Law of Electromagnetic Induction.",
        answer: 'The induced electromotive force (EMF) in any closed circuit is equal to the negative rate of change of the magnetic flux enclosed by the circuit: ε = -dΦ_B / dt.',
        hint: 'The negative sign reflects Lenz’s Law opposing flux change.',
        easeFactor: 2.5,
        intervalDays: 3,
        repetitions: 1,
        nextReviewAt: daysAgoIso(0, 6),
      },
      {
        id: 'fc-3',
        deckId: 'deck-sci',
        question: 'What does Heisenberg’s Uncertainty Principle state mathematically?',
        answer: 'Δx · Δp ≥ ħ / 2 — you cannot simultaneously know both the exact position and exact momentum of a quantum particle beyond this fundamental limit.',
        easeFactor: 2.6,
        intervalDays: 1,
        repetitions: 0,
        nextReviewAt: daysAgoIso(1),
      },
      {
        id: 'fc-4',
        deckId: 'deck-math',
        question: 'When is a square matrix A invertible in terms of its determinant and eigenvalues?',
        answer: 'A is invertible if and only if det(A) ≠ 0, which is equivalent to saying 0 is not an eigenvalue of A and its columns are linearly independent.',
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        nextReviewAt: daysAgoIso(1),
      },
      {
        id: 'fc-5',
        deckId: 'deck-math',
        question: 'What is the geometric meaning of the gradient vector ∇f(x, y)?',
        answer: 'It points in the direction of the steepest rate of ascent of the scalar function f, and its magnitude equals the maximum directional derivative at that point.',
        easeFactor: 2.5,
        intervalDays: 2,
        repetitions: 1,
        nextReviewAt: daysAgoIso(0, 4),
      },
      {
        id: 'fc-6',
        deckId: 'deck-cs',
        question: "What is the time complexity of Dijkstra's algorithm with a binary min-heap?",
        answer: 'O((V + E) log V), where V is the number of vertices and E is the number of edges (requires non-negative edge weights).',
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        nextReviewAt: daysAgoIso(1),
      },
      {
        id: 'fc-7',
        deckId: 'deck-cs',
        question: 'What two properties must a problem have to be solved efficiently with Dynamic Programming?',
        answer: '1) Optimal Substructure (optimal solution can be constructed from optimal solutions of subproblems) and 2) Overlapping Subproblems.',
        easeFactor: 2.5,
        intervalDays: 7,
        repetitions: 2,
        nextReviewAt: daysFromNowDate(4) + 'T12:00:00.000Z',
      },
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Calculus Formulas',
        content: 'Core Integration Identities:\n• ∫ f(x) dx = F(x) + C\n• Integration by Parts: ∫ u dv = uv - ∫ v du\n• Chain Rule: d/dx [f(g(x))] = f\'(g(x)) · g\'(x)\n• Polar Jacobian: dA = r dr dθ\n\nRemember to check boundary limits when substituting u.',
        subjectId: 'sub-math',
        pinned: true,
        tint: 'amber',
        updatedAt: daysAgoIso(0, 11),
      },
      {
        id: 'note-2',
        title: 'Research Ideas',
        content: 'Potential Capstone & Lab Topics:\n1. Adaptive spaced repetition intervals using reaction-time latency.\n2. Visualizing magnetic flux lines interactively in 2D cross-sections.\n3. Comparing A* heuristics on sparse urban road graphs.',
        subjectId: 'sub-cs',
        pinned: true,
        tint: 'indigo',
        updatedAt: daysAgoIso(1, 16),
      },
      {
        id: 'note-3',
        title: 'Study Tips & Deep Work',
        content: 'Daily Focus Checklist:\n[x] Focus deeply in 25–50 min uninterrupted blocks\n[x] Take 5 min screen-free breaks to consolidate memory\n[x] Revise flashcards before bed for retention\n[ ] Summarize each chapter in 5 bullet points without looking',
        subjectId: 'sub-cs',
        pinned: false,
        tint: 'emerald',
        updatedAt: daysAgoIso(2, 13),
      },
      {
        id: 'note-4',
        title: 'Quantum Theory Notes',
        content: 'Wavefunction Collapse & Quantization:\n• Energy of a photon: E = hf = hc / λ\n• De Broglie wavelength: λ = h / p\n• Probability density is given by |ψ(x, t)|²\n• Particle in an infinite 1D box has discrete levels E_n = n²h² / (8mL²).',
        subjectId: 'sub-phys',
        pinned: false,
        tint: 'purple',
        updatedAt: daysAgoIso(1, 20),
      },
    ],
    dailyGoals: [
      { id: 'dg-1', text: 'Complete Vector Spaces problem set (Chapter 2)', completed: false, subjectId: 'sub-math' },
      { id: 'dg-2', text: 'Finish 2 Pomodoro sessions on Dynamic Programming', completed: true, subjectId: 'sub-cs' },
      { id: 'dg-3', text: 'Review all due flashcards before 9 PM', completed: false, subjectId: 'sub-phys' },
    ],
    rooms: [
      {
        id: 'room-study24',
        code: 'STUDY24',
        name: 'Math Study Group',
        subjectFocus: 'Linear Algebra & Calculus',
        monthlyGoalHours: 50,
        completedHours: 32,
        members: [
          { id: 'm-self', name: 'Learner (You)', initials: 'LN', subject: 'Mathematics', status: 'studying', studiedMinutesToday: 125, accent: 'purple', isCurrentUser: true },
          { id: 'm-1', name: 'Rifat Hasan', initials: 'RH', subject: 'Mathematics', status: 'studying', studiedMinutesToday: 145, accent: 'cyan' },
          { id: 'm-2', name: 'Nusrat Jahan', initials: 'NJ', subject: 'Research Paper', status: 'revising', studiedMinutesToday: 110, accent: 'amber' },
          { id: 'm-3', name: 'Tamim Ahmed', initials: 'TA', subject: 'Physics', status: 'break', studiedMinutesToday: 95, accent: 'blue' },
        ],
        messages: [
          {
            id: 'msg-1',
            senderName: 'Rifat Hasan',
            senderInitials: 'RH',
            text: 'Starting a 25-min Pomodoro on Eigenvalues. Who is joining this block?',
            timestamp: daysAgoIso(0, 10),
          },
          {
            id: 'msg-2',
            senderName: 'Nusrat Jahan',
            senderInitials: 'NJ',
            text: 'In! Just wrapped up my literature outline and moving to flashcard review.',
            timestamp: daysAgoIso(0, 10),
          },
          {
            id: 'msg-3',
            senderName: 'Tamim Ahmed',
            senderInitials: 'TA',
            text: 'Taking a 5-min coffee break after Gauss Law derivations. We are at 32/50h for the month!',
            timestamp: daysAgoIso(0, 11),
          },
        ],
      },
      {
        id: 'room-csalgo',
        code: 'ALGO88',
        name: 'CS Algorithms Sprint',
        subjectFocus: 'Graphs & Dynamic Programming',
        monthlyGoalHours: 40,
        completedHours: 27,
        members: [
          { id: 'm-self-2', name: 'Learner (You)', initials: 'LN', subject: 'Computer Science', status: 'studying', studiedMinutesToday: 75, accent: 'purple', isCurrentUser: true },
          { id: 'm-4', name: 'Aisha Karim', initials: 'AK', subject: 'Dynamic Programming', status: 'studying', studiedMinutesToday: 130, accent: 'emerald' },
          { id: 'm-5', name: 'Daniel Cho', initials: 'DC', subject: 'System Design', status: 'break', studiedMinutesToday: 60, accent: 'rose' },
        ],
        messages: [
          {
            id: 'msg-4',
            senderName: 'Aisha Karim',
            senderInitials: 'AK',
            text: 'Tip: Draw the DP state transition table on paper first before coding the recurrence.',
            timestamp: daysAgoIso(0, 13),
          },
        ],
      },
    ],
    activeRoomId: 'room-study24',
    revisedTodayCount: 14,
    lastRevisionDate: todayStr,
  };
}
