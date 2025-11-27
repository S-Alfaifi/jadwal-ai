
# Jadwal.Ai - Smart University Schedule Builder


---

Jadwal.Ai is a web application designed to help university students effortlessly generate optimal, conflict-free class schedules. The core idea is to eliminate the tedious and frustrating manual process of juggling courses, sections, and timings. Users can simply input their course data, and Jadwal.Ai's intelligent engine will find all possible valid schedule combinations in seconds.

The project is built with a focus on a clean user experience, performance, and accessibility, supporting both English and Arabic (RTL) languages, as well as light and dark modes.

## ✨ Features

- **Course Management**: Easily add, edit, and delete courses, including details like course name and final exam period.
- **Section Management**: Add multiple sections for each course, each with its own unique lecture and lab timings.
- **Flexible Time Slots**: Define multiple time slots for any lecture or lab, specifying days, start/end times, and classroom locations.
- **Selective Scheduling**:
  - **Course Toggle**: Quickly include or exclude entire courses from the schedule generation process.
  - **Section Toggle**: Fine-tune your schedule by enabling or disabling specific sections within a course.
- **Intelligent Schedule Generation**: The core engine checks for two types of conflicts:
  - **Time Conflicts**: Ensures no two classes overlap on the same day and time.
  - **Exam Conflicts**: Verifies that no two courses share the same final exam period.
- **Multiple Alternatives**: View and cycle through all possible valid schedule combinations to find the one that best fits your lifestyle.
- **Schedule Export**: Download a high-quality PNG image of your final schedule to save or share.
- **Theming**:
  - **Light & Dark Mode**: Switch between themes for comfortable viewing in any lighting condition.
  - **Customizable Palettes**: The app uses CSS variables for easy theme customization.
- **Multi-Language Support**:
  - Full interface translation for **English** and **Arabic**.
  - Seamless **Right-to-Left (RTL)** layout support for Arabic.

## 🛠️ Tech Stack

Jadwal.Ai is built with a modern, performant, and type-safe stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) for pre-built components.
- **Forms**: [React Hook Form](https://react-hook-form.com/) for performance and [Zod](https://zod.dev/) for schema validation.
- **State Management**: React Hooks (`useState`, `useContext`, `useEffect`) for local and global state.
- **Animations & Styling**: `styled-components`, `tailwindcss-animate`.
- **AI Tooling**: [Genkit](https://firebase.google.com/docs/genkit) for generative AI features.
- **Deployment**: Next.js on Vercel or any Node.js compatible environment.

## 🚀 Installation and Running

To get a local copy up and running, follow these simple steps.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/jadwal-ai.git
    cd jadwal-ai
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

The project follows a standard Next.js App Router structure, with clear separation of concerns.

```
/
├── src/
│   ├── app/                # Main application routes (pages)
│   │   ├── (pages)/
│   │   │   ├── editor/     # Course & section input page
│   │   │   └── schedule/   # Schedule display page
│   │   ├── globals.css     # Global styles & theme variables
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable React components
│   │   ├── ui/             # Core UI components from shadcn/ui
│   │   ├── add-course-form.tsx
│   │   ├── course-card.tsx
│   │   └── ...
│   ├── lib/                # Core logic, types, and utilities
│   │   ├── scheduler.ts    # The schedule generation algorithm
│   │   ├── translations.ts # English & Arabic translations
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── utils.ts        # Utility functions
│   ├── context/            # React context providers (e.g., Language)
│   └── ai/                 # Genkit flows and AI-related logic
├── public/                 # Static assets (images, fonts)
├── tailwind.config.ts      # Tailwind CSS configuration
└── next.config.ts          # Next.js configuration
```

## 🎨 How Theming Works

The application supports both light and dark themes using CSS variables, powered by `next-themes`.

- **Theme Variables**: The color palette is defined in `src/app/globals.css` under the `:root` (light mode) and `.dark` selectors.
- **Switching**: The `useTheme` hook from `next-themes` is used to toggle the theme, which adds or removes the `.dark` class from the `<html>` element, activating the corresponding CSS variables.
- **No Harsh Colors**: The palettes are designed to be easy on the eyes, avoiding pure black and pure white to reduce eye strain during long study sessions.

## 🧠 How Schedule Generation Works

The schedule generation is a client-side algorithm handled by the `src/lib/scheduler.ts` file.

1.  **Filtering**: The generator first takes all courses and sections that are currently enabled by the user.
2.  **Recursive Backtracking**: It uses a recursive function to try every possible combination of sections for the selected courses.
3.  **Conflict Checking**: At each step, it checks for two types of conflicts:
    - **Time Conflict**: Do any two classes in the current combination overlap?
    - **Exam Conflict**: Do any two courses have the same final exam period?
4.  **Validation**: If a combination has no conflicts, it's considered a valid schedule and is added to a list of solutions.
5.  **Partial Schedules**: If no full schedules can be found, the algorithm attempts to generate partial schedules by excluding one course at a time to provide the next-best alternatives.
6.  **Sorting & Display**: Valid schedules are sorted by "gap score" (total time between classes) to prioritize more compact schedules first. The top 20 unique results are presented to the user.

## 📸 Screenshots

<p align="center">
  <b>Welcome Page</b><br>
  <img src="/screenshots/home.png" alt="Welcome Page Screenshot" width="70%">
</p>
<p align="center">
  <b>Course Editor (Dark Mode)</b><br>
  <img src="/screenshots/editor-dark.png" alt="Editor Screenshot" width="70%">
</p>
<p align="center">
  <b>Generated Schedule (Arabic RTL)</b><br>
  <img src="/screenshots/schedule-ar.png" alt="Schedule Screenshot" width="70%">
</p>

## 🌐 Live Demo

Check out the live version of the project deployed here:

[**https://jadwal.ai**](https://jadwal.ai)

## 🔮 Future Improvements

While Jadwal.Ai is fully functional, there are several features that could be added to make it even better:

- **AI-Powered Suggestions**: Use an LLM to suggest alternative sections or courses if no conflict-free schedule can be found.
- **Account & Cloud Sync**: Add Firebase Authentication and Firestore to allow users to save their courses and schedules to the cloud.
- **Gap Optimization**: Allow users to set preferences for schedule optimization (e.g., "minimize gaps," "prefer morning classes").
- **Calendar Integration**: Export schedules to Google Calendar, Apple Calendar, or as an `.ics` file.
- **Mobile App**: Develop a native mobile version using React Native for an even better on-the-go experience.
