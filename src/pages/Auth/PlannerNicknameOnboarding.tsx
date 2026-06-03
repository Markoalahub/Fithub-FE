import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { NicknameDuplicateCheckResponse } from "../../services/api";

interface PlannerNicknameOnboardingProps {
  onCheckNickname: (
    nickname: string,
  ) => Promise<NicknameDuplicateCheckResponse>;
  onSubmitOnboarding: (nickname: string) => Promise<void>;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";

export default function PlannerNicknameOnboarding({
  onCheckNickname,
  onSubmitOnboarding,
}: PlannerNicknameOnboardingProps) {
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState<{
    nickname: string;
    isDuplicate: boolean;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedNickname = nickname.trim();

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setFormError(null);

    const nextTrimmed = value.trim();
    if (checkedNickname && checkedNickname.nickname !== nextTrimmed) {
      setCheckedNickname(null);
    }
  };

  const handleCheckNickname = async () => {
    if (!trimmedNickname) {
      setFormError("닉네임을 입력해 주세요.");
      setCheckedNickname(null);
      return;
    }

    setIsCheckingNickname(true);
    setFormError(null);

    try {
      const result = await onCheckNickname(trimmedNickname);
      setCheckedNickname({
        nickname: trimmedNickname,
        isDuplicate: result.isDuplicate,
        message: result.message,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setCheckedNickname(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!trimmedNickname) {
      setFormError("닉네임을 입력해 주세요.");
      return;
    }

    if (!checkedNickname || checkedNickname.nickname !== trimmedNickname) {
      setFormError("닉네임 중복 확인을 먼저 진행해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const latestCheck = await onCheckNickname(trimmedNickname);
      setCheckedNickname({
        nickname: trimmedNickname,
        isDuplicate: latestCheck.isDuplicate,
        message: latestCheck.message,
      });

      if (latestCheck.isDuplicate) {
        return;
      }

      await onSubmitOnboarding(trimmedNickname);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 py-10 text-gray-900">
      <section className="w-full max-w-xl rounded-3xl border border-[#E5E5E5] bg-white p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            FITHUB
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">기획자 온보딩</h1>
          <p className="mt-2 text-sm text-gray-500">
            유니크한 닉네임 설정 후 메인 화면으로 이동합니다.
          </p>
        </div>

        <div className="mt-8">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Nickname
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={nickname}
              onChange={(event) => handleNicknameChange(event.target.value)}
              placeholder="닉네임을 입력해 주세요"
              className="w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              disabled={isCheckingNickname || isSubmitting}
              className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingNickname ? "확인 중..." : "중복 확인"}
            </button>
          </div>

          {checkedNickname && (
            <p
              className={`mt-2 text-sm ${
                checkedNickname.isDuplicate ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {checkedNickname.message}
            </p>
          )}

          {formError && <p className="mt-2 text-sm text-rose-600">{formError}</p>}

          <button
            type="button"
            onClick={handleSubmitOnboarding}
            disabled={isSubmitting || isCheckingNickname}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 py-3 text-sm font-semibold text-[#181600] transition hover:bg-[#F9E000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "온보딩 처리 중..." : "온보딩 완료"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </section>
    </div>
  );
}
