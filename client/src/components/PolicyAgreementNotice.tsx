import { Link } from "wouter";

type PolicyAgreementNoticeProps = {
  action: "creating an account" | "continuing";
};

export default function PolicyAgreementNotice({
  action,
}: PolicyAgreementNoticeProps) {
  return (
    <p
      className="text-center text-xs leading-5 text-gray-400"
      data-testid="policy-agreement-notice"
    >
      By {action}, you agree to the{" "}
      <Link
        href="/terms"
        className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        data-testid="link-agreement-terms"
      >
        Terms of Service &amp; End User License Agreement
      </Link>
      ,{" "}
      <Link
        href="/privacy"
        className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        data-testid="link-agreement-privacy"
      >
        Privacy Policy
      </Link>
      , and{" "}
      <Link
        href="/copyright"
        className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        data-testid="link-agreement-copyright"
      >
        Copyright Policy
      </Link>
      .
    </p>
  );
}