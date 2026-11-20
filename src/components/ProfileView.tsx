import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  GraduationCap,
  Building2,
  BookOpen,
  Hash,
  Users,
  Camera,
  Trash2,
  Check,
  Flame,
  Clock,
  CheckCircle2,
  BarChart3,
  Settings,
  Award,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { InstitutionType, SubjectAccent } from '../types/studyflow';

const INSTITUTION_TYPES: { id: InstitutionType; label: string }[] = [
  { id: 'school', label: 'School' },
  { id: 'college', label: 'College' },
  { id: 'university', label: 'University' },
  { id: 'other', label: 'Other' },
];

const AVATAR_SWATCHES: { id: SubjectAccent; label: string; bg: string; ring: string }[] = [
  { id: 'purple', label: 'Electric Purple', bg: 'bg-[#7C3AED]', ring: 'ring-[#7C3AED]/40' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-[#0891B2]', ring: 'ring-[#06B6D4]/40' },
  { id: 'blue', label: 'Royal Blue', bg: 'bg-[#2563EB]', ring: 'ring-[#3B82F6]/40' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-[#059669]', ring: 'ring-[#10B981]/40' },
  { id: 'amber', label: 'Amber', bg: 'bg-[#D97706]', ring: 'ring-[#F59E0B]/40' },
  { id: 'rose', label: 'Rose', bg: 'bg-[#E11D48]', ring: 'ring-[#F43F5E]/40' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarBg(color?: SubjectAccent): string {
  return AVATAR_SWATCHES.find((s) => s.id === color)?.bg ?? 'bg-[#7C3AED]';
}

function resizeImageToDataUrl(file: File, maxSize = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileView() {
  const { state, metrics, updateProfile, setActiveTab, showToast } = useStudyFlow();
  const profile = state.profile;

  const [name, setName] = useState(profile.name);
  const [institution, setInstitution] = useState(profile.institution ?? '');
  const [institutionType, setInstitutionType] = useState<InstitutionType>(
    profile.institutionType ?? 'college'
  );
  const [classOrYear, setClassOrYear] = useState(profile.classOrYear ?? '');
  const [department, setDepartment] = useState(profile.department ?? profile.academicTrack ?? '');
  const [studentId, setStudentId] = useState(profile.studentId ?? '');
  const [sectionOrBatch, setSectionOrBatch] = useState(profile.sectionOrBatch ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarColor, setAvatarColor] = useState<SubjectAccent>(profile.avatarColor ?? 'purple');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(profile.avatarDataUrl);

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(profile.name);
    setInstitution(profile.institution ?? '');
    setInstitutionType(profile.institutionType ?? 'college');
    setClassOrYear(profile.classOrYear ?? '');
    setDepartment(profile.department ?? profile.academicTrack ?? '');
    setStudentId(profile.studentId ?? '');
    setSectionOrBatch(profile.sectionOrBatch ?? '');
    setBio(profile.bio ?? '');
    setAvatarColor(profile.avatarColor ?? 'purple');
    setAvatarDataUrl(profile.avatarDataUrl);
  }, [profile]);

  const hasUnsavedChanges =
    name !== profile.name ||
    institution !== (profile.institution ?? '') ||
    institutionType !== (profile.institutionType ?? 'college') ||
    classOrYear !== (profile.classOrYear ?? '') ||
    department !== (profile.department ?? profile.academicTrack ?? '') ||
    studentId !== (profile.studentId ?? '') ||
    sectionOrBatch !== (profile.sectionOrBatch ?? '') ||
    bio !== (profile.bio ?? '') ||
    avatarColor !== (profile.avatarColor ?? 'purple') ||
    avatarDataUrl !== profile.avatarDataUrl;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240);
      setAvatarDataUrl(dataUrl);
      updateProfile({ avatarDataUrl: dataUrl });
      showToast('Profile photo updated');
    } catch {
      showToast('Could not load that image. Please try another file.');
    }
  };

  const handleRemovePhoto = () => {
    setAvatarDataUrl(undefined);
    updateProfile({ avatarDataUrl: undefined });
    showToast('Profile photo removed');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = name.trim() || 'Learner';
    const cleanedDept = department.trim();
    updateProfile({
      name: cleanedName,
      institution: institution.trim(),
      institutionType,
      classOrYear: classOrYear.trim(),
      department: cleanedDept,
      academicTrack: cleanedDept || profile.academicTrack || 'General Studies',
      studentId: studentId.trim(),
      sectionOrBatch: sectionOrBatch.trim(),
      bio: bio.trim(),
      avatarColor,
      avatarDataUrl,
    });
    showToast('Student profile saved');
  };

  const typeLabel =
    INSTITUTION_TYPES.find((t) => t.id === institutionType)?.label ?? 'Student';

  const metadataParts = [
    institution.trim() ? typeLabel : null,
    classOrYear.trim() || null,
    department.trim() || null,
    sectionOrBatch.trim() || null,
    studentId.trim() ? `ID: ${studentId.trim()}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize your name, school or college details, and academic identity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#7C3AED] transition-colors whitespace-nowrap cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            Progress Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#7C3AED] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Settings
          </button>
        </div>
      </div>

      {/* Live Student Identity Card */}
      <section className="rounded-3xl bg-gradient-to-br from-white via-[#F6F3FF] to-[#EEF8FF] dark:from-[#171230] dark:via-[#111124] dark:to-[#0C1829] border border-[#7C3AED]/15 dark:border-white/[0.09] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar + Quick Upload */}
          <div className="relative self-start shrink-0">
            {avatarDataUrl ? (
              <img
                src={avatarDataUrl}
                alt={name || 'Student avatar'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-white/10 shadow-md"
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${getAvatarBg(avatarColor)} text-white font-display text-2xl sm:text-3xl font-extrabold flex items-center justify-center ring-4 ring-white dark:ring-white/10 shadow-md`}
              >
                {getInitials(name || 'Learner')}
              </div>
            )}

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Upload profile photo"
              title="Upload profile photo"
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white dark:bg-[#1D1B38] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] shadow-md flex items-center justify-center transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Identity Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {name.trim() || 'Learner'}
              </h2>
              {avatarDataUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove photo
                </button>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[#6D28D9] dark:text-[#C4B5FD]">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {institution.trim() || 'Add your school, college, or university below'}
              </span>
            </div>

            {metadataParts.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                {metadataParts.map((item, index) => (
                  <React.Fragment key={`${item}-${index}`}>
                    {index > 0 && (
                      <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">
                        ·
                      </span>
                    )}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </p>
            )}

            {bio.trim() && (
              <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {bio.trim()}
              </p>
            )}
          </div>
        </div>

        {/* Academic Snapshot Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Study Streak</p>
              <p className="font-display text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {profile.streakDays} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Focus</p>
              <p className="font-display text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {metrics.totalHoursAllTime}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Syllabus Done</p>
              <p className="font-display text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {metrics.completedTopics}/{metrics.totalTopics}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE] shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Active Subjects</p>
              <p className="font-display text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {state.subjects.length} subjects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile & School / College Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 space-y-6"
      >
        {/* Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Your Full Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahat Hasan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Avatar Color
              </span>
              <div className="flex items-center gap-2.5 pt-1.5">
                {AVATAR_SWATCHES.map((swatch) => {
                  const selected = avatarColor === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setAvatarColor(swatch.id)}
                      aria-label={swatch.label}
                      title={swatch.label}
                      className={`w-8 h-8 rounded-full ${swatch.bg} transition-transform cursor-pointer flex items-center justify-center ${
                        selected ? `ring-4 ${swatch.ring} scale-105` : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Study Goal / Bio
            </span>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Preparing for HSC & University Admission — aiming for 4 hours of focused study daily."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
            />
          </label>
        </div>

        <div className="border-t border-slate-100 dark:border-white/[0.07]" />

        {/* School / College / University Information */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                School / College / University Information
              </h2>
            </div>

            {/* Institution Type Segmented Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] self-start">
              {INSTITUTION_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setInstitutionType(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    institutionType === item.id
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                {institutionType === 'school'
                  ? 'School Name'
                  : institutionType === 'college'
                    ? 'College Name'
                    : institutionType === 'university'
                      ? 'University Name'
                      : 'Institution Name'}
              </span>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={
                  institutionType === 'school'
                    ? 'e.g. Ideal School and College, Motijheel'
                    : institutionType === 'college'
                      ? 'e.g. Notre Dame College, Dhaka'
                      : institutionType === 'university'
                        ? 'e.g. University of Dhaka / BUET'
                        : 'e.g. Your academy or study center'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Class / Year / Semester
              </span>
              <input
                type="text"
                value={classOrYear}
                onChange={(e) => setClassOrYear(e.target.value)}
                placeholder={
                  institutionType === 'school'
                    ? 'e.g. Class 10 / SSC Candidate'
                    : institutionType === 'college'
                      ? 'e.g. HSC 2nd Year / Class 12'
                      : 'e.g. 3rd Year · Semester 1'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                Group / Department / Major
              </span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Science / Business Studies / CSE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Roll Number / Student ID (optional)
              </span>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. Roll 14 or 2024-CSE-042"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Section / Batch (optional)
              </span>
              <input
                type="text"
                value={sectionOrBatch}
                onChange={(e) => setSectionOrBatch(e.target.value)}
                placeholder="e.g. Section A · Batch 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-white/[0.07]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hasUnsavedChanges
              ? 'You have unsaved profile changes.'
              : 'All profile details are saved locally on your device.'}
          </p>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
