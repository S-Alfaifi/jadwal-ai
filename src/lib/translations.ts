
import type { Day } from "./types";

const translationData = {
  en: {
    welcome: {
        title: "The smart way to build your university schedule",
        subtitle: "Jadwal.Ai helps you generate conflict-free class schedules in seconds. Add your courses, select your sections, and let us handle the rest.",
        cta: "Create Your Schedule",
        aboutTitle: "About the Developer",
        aboutMe: "I'm Sulaiman, a Computer Science Student, passionate about AI and building practical tools. This project is a personal experiment to make schedule planning easier and smarter for students. Built with simplicity and efficiency in mind.",
        builtWithAi: "Note: Built with the help of AI tools as part of a learning journey in smart web development.",
    },
    editor: {
        title: "Create Your Schedule",
        subtitle: "Add your courses below. Toggle courses or specific sections to include them in the final schedule.",
        addCourse: "Add Course",
        addCourseTooltip: "Manually add a new course",
        generateSchedule: "Generate Schedule",
        noCourses: {
            title: "No courses added yet",
            description: "Click on 'Add Course' to start building your schedule.",
        },
    },
    schedule: {
        loading: "Generating optimal schedules...",
        backToEdit: "Back to Edit",
        backToEditTooltip: "Return to the course selection page",
        partial: {
            title: "Partial Schedule Generated",
            cannotGenerateFull: "A full schedule could not be generated with all selected courses.",
            excluded: "This schedule was created by excluding:",
        },
        conflict: {
            title: "Potential Conflict Detected",
            description: {
                cannotCreate: "A full schedule could not be created because",
                and: "and",
                haveA: "have a",
                conflict: "conflict",
            },
            types: {
                time: "time conflict",
                exam: "exam conflict",
            }
        },
        noSchedule: {
            title: "No Conflict-Free Schedule Found",
            description: "We couldn't generate any possible schedule with the courses and sections you enabled.",
            backButton: "Go Back and Edit Courses",
        }
    },
    addCourseForm: {
        addTitle: "Add a New Course",
        editTitle: "Edit Course",
        description: {
            add: "Manage your course details and sections below.",
            edit: "Manage your course details and sections below."
        },
        courseNameLabel: "Course Name",
        courseNamePlaceholder: "e.g. Introduction to AI",
        examPeriodLabel: "Final Exam Period",
        examPeriodPlaceholder: "e.g. 5",
        sectionsLabel: "Sections",
        addSectionButton: "Add New Section",
        cancelButton: "Cancel",
        deleteSectionDialog: {
          title: "Are you sure?",
          description: "This will permanently delete this section and all its time slots.",
          cancel: "Cancel",
          confirm: "Delete"
        },
        submitButton: {
            add: "Add Course",
            edit: "Save Changes",
        },
    },
    sectionForm: {
      addTitle: "Add New Section",
      editTitle: "Edit Section",
      description: "Fill in the details for this section, including all lecture and lab times.",
      sectionNameLabel: "Section Name",
      sectionNamePlaceholder: "e.g. Section 1",
      addLectureTimeSlot: "Add Lecture Time Slot",
      addLabTimeSlot: "Add Lab Time Slot",
      addLectureButton: "Add Lecture Times",
      addLabButton: "Add Lab Times",
      hasLabLabel: "This section has a lab",
      classroomLabel: "Classroom",
      optionalLabel: "(Optional)",
      classroomPlaceholder: "e.g. Room 101",
      daysLabel: "Days",
      startTimeLabel: "Start Time",
      endTimeLabel: "End Time",
      backButton: "Back to Course",
      saveButton: "Save Section",
      timeSlot: "Time Slot",
      classTypes: {
          lecture: 'Lecture Times',
          lab: 'Lab Times',
      },
      days: {
          Sun: 'Sun',
          Mon: 'Mon',
          Tue: 'Tue',
          Wed: 'Wed',
          Thu: 'Thu',
      },
      errors: {
        atLeastOneDay: "Please select at least one day.",
        invalidTime: "Invalid time format.",
        endTimeAfterStart: "End time must be after start time.",
        atLeastOneTimeslot: "Please add at least one time slot.",
        selfConflict: "Time slot #%j conflicts with time slot #%i.",
        noLectureOrLab: "A section must have either lecture or lab times.",
        lectureLabConflict: "Lab time slot #%j conflicts with Lecture time slot #%i."
      }
    },
    courseCard: {
        changeColorTooltip: "Change Color",
        sectionsCount: "Section(s)",
        examPeriod: "Final Exam Period",
        editTooltip: "Edit Course",
        deleteTooltip: "Delete Course",
        enabled: "Enabled",
        disabled: "Disabled",
        classTypes: {
            Lecture: 'Lecture',
            Lab: 'Lab',
        }
    },
    scheduleControls: {
        title: "Generated Schedules",
        displaying: "Displaying alternative",
        of: "of",
        toggles: {
            classroom: "Classroom",
            classTypes: "Class Types",
            sectionNames: "Section Names",
        },
        tooltips: {
            classroom: "Toggle the visibility of classroom numbers.",
            classTypes: "Toggle the visibility of class types (Lecture/Lab).",
            sectionNames: "Toggle the visibility of section names in the schedule.",
            saveImage: "Save Schedule as Image",
            previous: "Previous Schedule",
            next: "Next Schedule",
        }
    },
    scheduleView: {
        time: "Time",
        summary: {
            title: "Course Summary",
            description: "Details for the currently displayed schedule.",
            lecture: "Lecture",
            lab: "Lab"
        }
    },
    toasts: {
        courseDeleted: {
            title: "Course Deleted",
            description: "The course has been removed from your list.",
        },
        courseUpdated: {
            title: "Course Updated",
            description: "has been successfully updated.",
        },
        courseAdded: {
            title: "Course Added",
            description: "has been added to your list.",
        },
        noActiveCourses: {
            title: "No Active Courses",
            description: "Please enable at least one course and section to generate a schedule.",
        },
    },
    footer: {
        rights: "© 2025 Sulaiman Alfaifi — All rights reserved",
    }
  },
  ar: {
    welcome: {
        title: "الطريقة الذكية لإنشاء جدولك الجامعي",
        subtitle: "يساعدك Jadwal.Ai في إنشاء جداول دراسية خالية من التعارض في ثوانٍ. أضف مقرراتك، اختر شعبك، ودعنا نتولى الباقي.",
        cta: "أنشئ جدولك",
        aboutTitle: "عن المطور",
        aboutMe: "أنا سليمان، طالب علوم حاسب، شغوف بالذكاء الاصطناعي وبناء الأدوات العملية. هذا المشروع هو تجربة شخصية لجعل تخطيط الجداول أسهل وأذكى للطلاب. تم بناؤه بالبساطة والكفاءة في الاعتبار.",
        builtWithAi: "ملاحظة: تم بناؤه بمساعدة أدوات الذكاء الاصطناعي كجزء من رحلة تعلم في تطوير الويب الذكي.",
    },
    editor: {
        title: "أنشئ جدولك",
        subtitle: "أضف مقرراتك أدناه. قم بتبديل المقررات أو الشعب المحددة لتضمينها في الجدول النهائي.",
        addCourse: "أضف مقرر",
        addCourseTooltip: "إضافة مقرر جديد يدويًا",
        generateSchedule: "إنشاء الجدول",
        noCourses: {
            title: "لم تتم إضافة أي مقررات بعد",
            description: "انقر على 'أضف مقرر' لبدء بناء جدولك.",
        },
    },
    schedule: {
        loading: "جاري إنشاء الجداول المثلى...",
        backToEdit: "العودة للتعديل",
        backToEditTooltip: "الرجوع إلى صفحة اختيار المقررات",
        partial: {
            title: "تم إنشاء جدول جزئي",
            cannotGenerateFull: "تعذر إنشاء جدول كامل بجميع المقررات المحددة.",
            excluded: "تم إنشاء هذا الجدول باستثناء:",
        },
        conflict: {
            title: "تم اكتشاف تعارض محتمل",
            description: {
                cannotCreate: "تعذر إنشاء جدول كامل لأن",
                and: "و",
                haveA: "بينهما",
                conflict: "تعارض",
            },
            types: {
                time: "تعارض في الوقت",
                exam: "تعارض في الاختبار النهائي",
            }
        },
        noSchedule: {
            title: "لم يتم العثور على جدول بدون تعارض",
            description: "لم نتمكن من إنشاء أي جدول ممكن بالمقررات والشعب التي قمت بتفعيلها.",
            backButton: "العودة وتعديل المقررات",
        }
    },
    addCourseForm: {
        addTitle: "إضافة مقرر جديد",
        editTitle: "تعديل المقرر",
        description: {
          add: "قم بإدارة تفاصيل المقرر والشعب أدناه.",
          edit: "قم بإدارة تفاصيل المقرر والشعب أدناه."
        },
        courseNameLabel: "اسم المقرر",
        courseNamePlaceholder: "مثال: مقدمة في الذكاء الاصطناعي",
        examPeriodLabel: "فترة الاختبار النهائي",
        examPeriodPlaceholder: "مثال: 5",
        sectionsLabel: "الشعب",
        addSectionButton: "إضافة شعبة جديدة",
        cancelButton: "إلغاء",
        deleteSectionDialog: {
          title: "هل أنت متأكد؟",
          description: "سيؤدي هذا إلى حذف هذه الشعبة وجميع أوقاتها بشكل دائم.",
          cancel: "إلغاء",
          confirm: "حذف"
        },
        submitButton: {
            add: "إضافة المقرر",
            edit: "حفظ التغييرات",
        },
    },
    sectionForm: {
      addTitle: "إضافة شعبة جديدة",
      editTitle: "تعديل الشعبة",
      description: "املأ تفاصيل هذه الشعبة، بما في ذلك جميع أوقات النظري والمعامل.",
      sectionNameLabel: "اسم الشعبة",
      sectionNamePlaceholder: "مثال: شعبة 1",
      addLectureTimeSlot: "إضافة وقت للنظري",
      addLabTimeSlot: "إضافة وقت للعملي",
      addLectureButton: "إضافة أوقات النظري",
      addLabButton: "إضافة أوقات العملي",
      hasLabLabel: "هذه الشعبة لديها عملي",
      classroomLabel: "القاعة الدراسية",
      optionalLabel: "(اختياري)",
      classroomPlaceholder: "مثال: قاعة 101",
      daysLabel: "الأيام",
      startTimeLabel: "وقت البدء",
      endTimeLabel: "وقت الانتهاء",
      backButton: "العودة للمقرر",
      saveButton: "حفظ الشعبة",
      timeSlot: "خانة الوقت",
      classTypes: {
          lecture: 'أوقات النظري',
          lab: 'أوقات العملي',
      },
      days: {
          Sun: 'الأحد',
          Mon: 'الاثنين',
          Tue: 'الثلاثاء',
          Wed: 'الأربعاء',
          Thu: 'الخميس',
      },
      errors: {
        atLeastOneDay: "الرجاء تحديد يوم واحد على الأقل.",
        invalidTime: "تنسيق الوقت غير صالح.",
        endTimeAfterStart: "يجب أن يكون وقت الانتهاء بعد وقت البدء.",
        atLeastOneTimeslot: "الرجاء إضافة فترة زمنية واحدة على الأقل.",
        selfConflict: "فترة الوقت #%j تتعارض مع فترة الوقت #%i.",
        noLectureOrLab: "يجب أن تحتوي الشعبة على أوقات نظري أو أوقات عملي.",
        lectureLabConflict: "فترة وقت العملي #%j تتعارض مع فترة وقت النظري #%i."
      }
    },
    courseCard: {
        changeColorTooltip: "تغيير اللون",
        sectionsCount: "شعبة (شعب)",
        examPeriod: "فترة الاختبار النهائي",
        editTooltip: "تعديل المقرر",
        deleteTooltip: "حذف المقرر",
        enabled: "مفعل",
        disabled: "معطل",
        classTypes: {
            Lecture: 'نظري',
            Lab: 'عملي',
        }
    },
    scheduleControls: {
        title: "الجداول المنشأة",
        displaying: "عرض البديل",
        of: "من",
        toggles: {
            classroom: "القاعة",
            classTypes: "أنواع الحصص",
            sectionNames: "أسماء الشعب",
        },
        tooltips: {
            classroom: "تبديل عرض أرقام القاعات الدراسية.",
            classTypes: "تبديل عرض أنواع الحصص (نظري/عملي).",
            sectionNames: "تبديل عرض أسماء الشعب في الجدول.",
            saveImage: "حفظ الجدول كصورة",
            previous: "الجدول السابق",
            next: "الجدول التالي",
        }
    },
    scheduleView: {
        time: "الوقت",
        summary: {
            title: "ملخص المقررات",
            description: "تفاصيل الجدول المعروض حاليًا.",
            lecture: "نظري",
            lab: "عملي"
        }
    },
    toasts: {
        courseDeleted: {
            title: "تم حذف المقرر",
            description: "تمت إزالة المقرر من قائمتك.",
        },
        courseUpdated: {
            title: "تم تحديث المقرر",
            description: "تم تحديثه بنجاح.",
        },
        courseAdded: {
            title: "تمت إضافة المقرر",
            description: "تمت إضافته إلى قائمتك.",
        },
        noActiveCourses: {
            title: "لا توجد مقررات نشطة",
            description: "يرجى تفعيل مقرر دراسي وشعبة واحدة على الأقل لإنشاء جدول زمني.",
        },
    },
    footer: {
        rights: "© 2025 سليمان الفيفي — جميع الحقوق محفوظة",
    }
  }
};

type Translations = typeof translationData;
export const translations: Translations = translationData;

    
    