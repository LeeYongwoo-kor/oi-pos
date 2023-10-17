import {
  MONTHLY_PRICE,
  MONTHLY_PRICE_JPY,
  PLAN_ID,
  YEARLY_PRICE,
  YEARLY_PRICE_JPY,
} from "@/constants/plan";
import { LocaleType } from "@/constants/type";
import getCurrency from "@/utils/menu/getCurrencyFormat";
import { Plan, Subscription, SubscriptionStatus } from "@prisma/client";

type PlanDetailProps = {
  plans: Plan[];
  subscription: Subscription | undefined;
  locale: Locale;
  openCheckoutModal: (planId: PlanType) => void;
};

const translations: {
  [key: string]: string | number;
} = {
  "Try riding Oi-POS": "Oi-POSに乗ってみよう!",
  "90-Day Free Trial": "90日間無料トライアル",
  "Have fun with Oi-POS every month": "毎月Oi-POSと遊ぼう!",
  "Monthly Paid": "月払い",
  "Oi-POS is your friend every year!": "毎年Oi-POSの親友になろう!",
  "1 Year Paid": "1年払い",
  FREE: "無料",
  [MONTHLY_PRICE]: MONTHLY_PRICE_JPY,
  [YEARLY_PRICE]: YEARLY_PRICE_JPY,
};

const translationsDetail: Record<Locale, { [key: string]: string }> = {
  en: {
    limitedMenus: "Limited to {0} menus",
    registeredTables: "Up to {0} registered tables",
    basicTemplate: "Basic menu design template",
    variousTemplates: "Various menu design templates",
    realTimeChat: "Real-time chat with customers",
    aiImage: "AI image generation",
  },
  ja: {
    limitedMenus: "{0} メニューまで",
    registeredTables: "{0} テーブルまで",
    basicTemplate: "基本メニューデザインテンプレート",
    variousTemplates: "様々なメニューデザインテンプレート",
    realTimeChat: "リアルタイムでのチャット",
    aiImage: "AI画像生成",
  },
};

export default function PlanDetail({
  plans,
  subscription,
  locale,
  openCheckoutModal,
}: PlanDetailProps) {
  const t = translationsDetail[locale];
  const isPlanSelectable = (planId: string) => {
    if (!subscription) return true;
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    )
      return true;
    if (subscription.planId === planId) return false;
    if (subscription.planId === PLAN_ID.YEARLY_PLAN) return false;
    if (
      subscription.planId === PLAN_ID.MONTHLY_PLAN &&
      planId === PLAN_ID.TRIAL_PLAN
    )
      return false;
    return true;
  };

  return (
    <div className="grid grid-cols-1 gap-4 min-h-[24rem] w-full sm:grid-cols-2 lg:grid-cols-3">
      {plans?.map((plan: Plan, index) => {
        const limitedMenus = t.limitedMenus.replace(
          "{0}",
          String(plan.maxMenus)
        );
        const registeredTables = t.registeredTables.replace(
          "{0}",
          String(plan.maxTables)
        );
        const selectable = isPlanSelectable(plan.id);
        const subscribed = subscription?.planId === plan.id;

        return (
          <div
            key={plan.id + index}
            className={`relative flex justify-between flex-col p-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 ${
              selectable
                ? "bg-white"
                : subscribed
                ? "border-2 bg-green-50 border-green-500 pointer-events-none"
                : "pointer-events-none opacity-50"
            }`}
          >
            <span
              className={`absolute flex justify-center items-center inset-1 px-2 py-0.5 bg-green-500 w-fit h-6 rounded-full text-xs text-white ${
                subscribed ? "block" : "hidden"
              }`}
            >
              Subscribed
            </span>
            <div className="mb-4">
              <h2 className="mb-3 text-2xl font-bold text-center text-sky-700">
                {locale === LocaleType.ja
                  ? translations[plan.name] || plan.name
                  : plan.name}
              </h2>
              <h3 className="mb-1.5 text-lg font-bold text-center bg-blue-200 text-sky-600">
                {locale === LocaleType.ja
                  ? translations[plan.description || ""] || plan.description
                  : plan.description}
              </h3>
              <h3 className="flex justify-center font-bold bg-blue-100 text-sky-900">
                {plan.id === PLAN_ID.TRIAL_PLAN
                  ? locale === LocaleType.ja
                    ? translations["FREE"]
                    : "FREE"
                  : locale === LocaleType.ja
                  ? getCurrency(Number(translations[plan.price]), "JPY")
                  : getCurrency(plan.price, "USD")}
              </h3>
            </div>
            <ul className="flex flex-col justify-center h-full pl-8 mb-6 list-disc bg-slate-50">
              <li>{limitedMenus}</li>
              <li>{registeredTables}</li>
              {plan.id === PLAN_ID.TRIAL_PLAN && <li>{t.basicTemplate}</li>}
              {plan.id !== PLAN_ID.TRIAL_PLAN && (
                <>
                  <li>{t.variousTemplates}</li>
                  <li>{t.realTimeChat}</li>
                  <li>{t.aiImage}</li>
                </>
              )}
            </ul>
            <button
              className={`w-full px-4 py-2 text-white transition duration-200 ease-in bg-blue-600 rounded hover:bg-blue-700 ${
                selectable
                  ? ""
                  : subscribed
                  ? "bg-green-400 opacity-90"
                  : "bg-gray-400"
              }`}
              onClick={(e) => {
                e.preventDefault();
                openCheckoutModal(plan.id as PlanType);
              }}
            >
              {locale === LocaleType.ja
                ? "このオプションを選択"
                : "Choose this option"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
