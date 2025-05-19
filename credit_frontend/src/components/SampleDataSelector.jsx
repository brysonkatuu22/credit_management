import React, { useState } from 'react';

// Sample data profiles with diverse responses
const sampleProfiles = {
  sample1: {
    name: "Optimistic Borrower",
    description: "A financially stable person with positive outlook",
    responses: [
      "I'm very confident in my ability to repay my current loan. I have a stable job and have set aside funds specifically for this purpose.",
      "No, I haven't missed any payments. I always pay on time or even early when possible.",
      "I feel very good about meeting my monthly obligations. My income comfortably covers all my expenses including loan payments.",
      "Extremely likely. I always prioritize debt repayment before discretionary spending.",
      "I don't struggle with payments, but if I did, it would probably be due to unexpected medical expenses.",
      "My income is very stable. I've been with the same employer for 5 years and receive regular salary increases.",
      "No financial stress at all. I have a good work-life balance and my finances are well-organized.",
      "No major financial challenges recently. Everything has been smooth sailing.",
      "Yes, I have an emergency fund that could cover 6 months of expenses if needed.",
      "Very satisfied with my loan terms. The interest rate is competitive and the repayment period works well for me.",
      "No, I don't need financial advice as I'm comfortable managing my finances independently.",
      "I would seek assistance immediately if I ever struggled with payments. I believe in addressing problems early.",
      "I'm moderately comfortable with financial risks. I prefer calculated risks with good potential returns.",
      "I'm paying more than the minimum payment each month to reduce the principal faster.",
      "I check my financial situation weekly and my credit score monthly.",
      "About 20% of my monthly income goes toward debt payments, which is well within recommended limits.",
      "Yes, I have a detailed plan to pay off my loan 2 years early by making extra payments. I'm fully committed to this plan."
    ]
  },
  sample2: {
    name: "Struggling Borrower",
    description: "Someone facing significant financial challenges",
    responses: [
      "Not confident at all. I'm worried every month about making payments.",
      "Yes, I've missed two payments in the last three months due to insufficient funds.",
      "I feel extremely anxious about my monthly loan obligations. It's a constant source of stress.",
      "I try to prioritize loan payments, but sometimes basic necessities have to come first.",
      "Job loss is the primary reason. I was laid off 4 months ago and have only found part-time work since then.",
      "My income is very unstable right now. I'm working gig jobs with unpredictable pay.",
      "Yes, I'm experiencing significant financial stress that keeps me up at night.",
      "I had a major medical expense three months ago that depleted my savings.",
      "No emergency fund left. I used it all for medical bills and living expenses after losing my job.",
      "Dissatisfied with my loan terms. The interest rate is too high for my current situation.",
      "No, but I should probably speak with a credit counselor soon.",
      "Very likely to seek help if things get worse. I'm already considering credit counseling.",
      "Not comfortable with financial risks at all right now. I need stability.",
      "I'm only able to make minimum payments currently, which isn't reducing my debt effectively.",
      "I check my finances daily out of anxiety, but avoid looking at my credit score because it's stressful.",
      "About 45% of my income goes to debt payments, which is unsustainable.",
      "I don't have a clear plan beyond trying to make minimum payments until I find stable employment again."
    ]
  },
  sample3: {
    name: "Neutral Borrower",
    description: "Someone with a balanced financial situation",
    responses: [
      "Moderately confident. I can make payments but it requires careful budgeting.",
      "I missed one payment about six months ago due to an oversight, but have been on time since.",
      "I feel okay about meeting obligations, though it sometimes requires adjusting other expenses.",
      "I prioritize loan payments equally with other essential expenses.",
      "Occasional unexpected expenses can make things tight some months.",
      "My income is relatively stable but does fluctuate seasonally.",
      "Some financial stress, but it's manageable and not overwhelming.",
      "Had to repair my car recently, which was expensive but I managed it without missing payments.",
      "I have a small emergency fund that would cover about 2 months of expenses.",
      "Neutral about my loan terms. The interest rate is average compared to similar loans.",
      "I occasionally read financial advice online but don't have a dedicated advisor.",
      "Somewhat likely to seek assistance if needed, though I'd try to solve problems myself first.",
      "Moderately comfortable with calculated financial risks that have reasonable returns.",
      "I make regular payments and occasionally add extra when I can afford it.",
      "I review my finances monthly and check my credit score quarterly.",
      "About 30% of my income goes toward debt payments, which is manageable but significant.",
      "I have a basic plan to pay off my loan on schedule, and I'm committed to it but sometimes need to adjust timing."
    ]
  },
  sample4: {
    name: "Short-Answer Borrower",
    description: "Someone who provides brief, direct responses",
    responses: [
      "Fairly confident.",
      "No missed payments.",
      "Comfortable with monthly obligations.",
      "Always prioritize loan payments.",
      "No struggles currently.",
      "Stable income.",
      "Minimal financial stress.",
      "No recent challenges.",
      "Yes, 3 months of expenses saved.",
      "Satisfied with terms.",
      "No financial advisor.",
      "Would seek help if needed.",
      "Moderate risk tolerance.",
      "Making regular payments plus extra.",
      "Monthly financial reviews.",
      "25% to debt payments.",
      "Yes, following a solid repayment plan."
    ]
  },
  sample5: {
    name: "Detailed Borrower",
    description: "Someone who provides thorough, analytical responses",
    responses: [
      "I would rate my confidence at approximately 7.5 out of 10. While I have established a consistent payment history over the past 18 months and maintain sufficient income to cover my obligations, I remain cognizant of potential economic uncertainties that could affect my employment sector in the coming year. Nevertheless, I've implemented contingency measures including a dedicated repayment fund that provides a three-month buffer should unexpected circumstances arise.",
      "I have not missed any payments in the past 24 months. I utilize automatic payments scheduled 3 days before the due date to ensure timely processing, and I maintain calendar reminders to verify that transactions have cleared successfully. Additionally, I reconcile my accounts weekly to catch any potential issues before they affect payment schedules.",
      "My analysis of my monthly cash flow indicates that my loan repayment obligations consume approximately 22% of my post-tax income, which falls within the recommended threshold of 28% for housing-related debt. I've stress-tested my budget for potential interest rate increases of up to 2% and determined that I could absorb such changes without significant lifestyle adjustments, though it would reduce my discretionary savings by approximately 15%.",
      "Based on my personal financial hierarchy, loan payments rank immediately after essential utilities and food expenses, but before discretionary spending categories. I've documented this prioritization in my monthly budget spreadsheet and adhere to it consistently, with loan payments receiving priority allocation from each paycheck before funds are distributed to lower-priority categories.",
      "While I don't currently struggle with payments, my risk assessment identifies three potential vulnerability factors: 1) Healthcare costs, as my insurance deductible increased this year; 2) Transportation expenses, as my vehicle is approaching 100,000 miles and may require increased maintenance; and 3) Potential industry contraction that could affect overtime opportunities which currently supplement my base income by approximately 12%.",
      "My income stability can be quantified as moderately high. I receive a consistent base salary with performance-based quarterly bonuses that have varied by no more than 15% over the past two years. My employment contract extends for another 18 months, and my employer's financial statements indicate stable growth projections for the foreseeable future.",
      "I would characterize my financial stress level as moderate and episodic rather than chronic. Using a self-assessment scale where 1 represents no stress and 10 represents severe stress, I typically operate at a 3-4 during normal periods, with temporary increases to 6-7 during annual insurance renewals and tax preparation seasons. These stress fluctuations have not impacted my payment behavior to date.",
      "In the past 12 months, I've navigated two significant financial challenges: an unexpected dental procedure costing $2,200 that exceeded insurance coverage, and a temporary reduction in work hours during our company's system migration project that reduced my income by approximately 18% for six weeks. I managed both situations by temporarily reallocating funds from my vacation savings and implementing targeted spending reductions without affecting loan payments.",
      "My emergency preparedness includes a dedicated high-yield savings account containing 4.5 months of essential expenses (calculated based on my minimum survival budget rather than my current lifestyle budget). I contribute 7% of each paycheck to this fund until it reaches my target of 6 months of expenses, at which point I redirect those contributions to retirement accounts. The fund is segregated from my regular checking account to reduce impulsive access.",
      "My satisfaction with my loan terms is mixed. The interest rate of 4.25% is competitive relative to market benchmarks at the time of origination, and the 15-year term aligns with my long-term financial planning horizon. However, I find the prepayment penalty clause unnecessarily restrictive, and the annual administrative fee of $75 seems excessive given the digital nature of most account management functions.",
      "I maintain a relationship with a fee-only financial advisor whom I consult annually for portfolio review and retirement planning. While loan management is not our primary focus, we do incorporate debt service obligations into my overall financial strategy. Additionally, I participate in a quarterly financial education webinar series offered through my employer's benefits program, which has provided useful insights on debt management strategies.",
      "My likelihood of seeking assistance is high and would be triggered by specific events rather than waiting for a crisis. I've established personal thresholds that would prompt me to seek help: 1) If my emergency fund drops below 2 months of expenses; 2) If I need to use credit cards for essential expenses for more than two consecutive months; or 3) If my debt-to-income ratio exceeds 35%. I've researched three potential resources in advance, including my lender's hardship program.",
      "My risk tolerance has been formally assessed through my investment advisor's risk profiling tool, which categorizes me as a 'moderate risk taker' with a score of 65/100. This translates to my debt management approach in that I'm willing to employ strategies like accelerated payment schedules that temporarily reduce my liquidity in exchange for long-term interest savings, but I maintain strict limits on the percentage of assets allocated to such strategies.",
      "My debt reduction strategy is multifaceted and includes: 1) Bi-weekly rather than monthly payments to reduce interest accrual; 2) Rounding up each payment to the nearest $50 increment; 3) Allocating 50% of any unexpected income (tax refunds, bonuses, gifts) to principal reduction; 4) Annual review of refinancing options when my credit score increases; and 5) Participation in my lender's interest rate reduction program for consistent on-time payments over 24 months.",
      "I employ a systematic approach to financial monitoring that includes weekly account reconciliation using budgeting software, monthly review of all credit accounts and payment histories, quarterly credit score checks through my bank's free monitoring service, and semi-annual comprehensive financial planning sessions where I update my net worth statement and review progress toward debt reduction goals. I also maintain a spreadsheet that projects the impact of additional principal payments on my loan amortization schedule.",
      "My current debt service ratio is 31.5%, calculated by dividing my total monthly debt obligations ($1,875) by my average monthly post-tax income ($5,952). This includes my mortgage (18.2%), auto loan (7.3%), student loan (4.5%), and revolving credit minimum payments (1.5%). While this ratio exceeds the ideal target of 28%, it has been decreasing steadily over the past year as I've eliminated two smaller debts and increased my income through professional certification.",
      "My loan repayment plan is documented in a detailed spreadsheet that projects complete repayment 37 months ahead of the original term, assuming continuation of my current accelerated payment strategy. The plan includes quarterly milestone targets for principal reduction and incorporates three potential scenarios based on different income projections. My commitment level is evidenced by the fact that I've consistently exceeded the baseline targets for the past 14 months, even during periods of unexpected expenses."
    ]
  },
  sample6: {
    name: "Mixed Sentiment Borrower",
    description: "Someone with varying sentiments across different aspects",
    responses: [
      "I'm somewhat confident, though it depends on how stable my job remains.",
      "Yes, I missed one payment about two months ago when I had a medical emergency.",
      "I feel quite good about meeting my monthly obligations most of the time.",
      "I usually prioritize loan payments, but sometimes other urgent expenses take precedence.",
      "Unexpected medical expenses have been the main challenge for me lately.",
      "My income is moderately stable, though I occasionally get fewer hours than I'd like.",
      "I do experience some financial stress, particularly toward the end of the month.",
      "Yes, I had a significant car repair expense recently that set me back financially.",
      "I have a small emergency fund, but it only covers about one month of expenses.",
      "I'm not particularly satisfied with my loan terms - the interest rate seems too high.",
      "No, I don't have a financial advisor, though I probably should consider getting one.",
      "I'm very likely to seek assistance if I'm struggling - I don't like to let problems fester.",
      "I'm quite risk-averse when it comes to finances, especially in the current economy.",
      "I'm making minimum payments and occasionally a bit extra when I can afford it.",
      "I check my finances about once a month, though sometimes I avoid it when I'm worried.",
      "About 35% of my income goes to debt payments, which feels like a lot.",
      "I have a basic plan to pay off my loans, but I'm not always able to stick to it."
    ]
  },
  sample7: {
    name: "Improving Borrower",
    description: "Someone whose financial situation is gradually improving",
    responses: [
      "My confidence has been growing over the past few months as my new job has stabilized.",
      "I missed payments earlier this year, but have been consistent for the past 4 months.",
      "I'm feeling increasingly positive about meeting my obligations as my budget has improved.",
      "I've made loan payments a top priority recently, right after essential living expenses.",
      "Previously, job instability was my main challenge, but my new position seems secure.",
      "My income has become much more stable since starting my new job three months ago.",
      "My financial stress has decreased significantly compared to six months ago.",
      "I faced unemployment earlier this year, but have recovered and am rebuilding my finances.",
      "I'm in the process of building an emergency fund - currently have about 3 weeks of expenses saved.",
      "The loan terms are reasonable, though I'm hoping to refinance once my credit improves a bit more.",
      "I recently attended a free financial workshop at my community center which was helpful.",
      "I would definitely seek help if needed - I've learned that waiting only makes problems worse.",
      "I'm becoming more comfortable with calculated risks as my financial situation stabilizes.",
      "I've created a debt snowball plan and have already paid off one small credit card.",
      "I now check my finances weekly and have set up alerts for my accounts.",
      "Currently about 30% of my income goes to debt, down from nearly 40% earlier this year.",
      "Yes, I have a detailed repayment plan that I've been following successfully for the past quarter."
    ]
  },
  sample8: {
    name: "Cautious Borrower",
    description: "Someone who is careful and conservative with finances",
    responses: [
      "Reasonably confident, though I always prepare for unexpected circumstances.",
      "No, I've never missed a payment. I set reminders and automatic payments to ensure timeliness.",
      "I feel adequately prepared to meet my obligations, though I remain vigilant about my budget.",
      "Loan payments are a top priority in my budget, immediately after essential living expenses.",
      "I don't currently struggle, but potential health issues could impact my financial stability.",
      "My income is stable, though I never take this for granted and maintain contingency plans.",
      "I experience minimal financial stress due to careful planning, though I remain vigilant.",
      "No major challenges recently, though I'm always preparing for potential difficulties.",
      "Yes, I maintain an emergency fund covering 4 months of expenses and am working to increase it.",
      "The loan terms are acceptable, though I regularly research refinancing options for improvement.",
      "I consult with a financial advisor annually to review my overall financial strategy.",
      "I would seek assistance promptly if needed, after exhausting my own contingency plans.",
      "I'm generally risk-averse, preferring stability and predictability in financial matters.",
      "I follow a conservative debt reduction strategy, making consistent payments above the minimum.",
      "I review my finances weekly and monitor my credit score monthly.",
      "Approximately 25% of my income goes to debt payments, which I consider a manageable level.",
      "I have a well-documented plan for loan repayment with built-in buffers for unexpected events."
    ]
  },
  sample9: {
    name: "Young Borrower",
    description: "A recent graduate with limited financial experience",
    responses: [
      "I think I can repay it, but this is my first major loan so I'm still figuring things out.",
      "No missed payments yet, but I've only had the loan for a few months.",
      "Sometimes I worry about making payments, especially since I'm just starting my career.",
      "I try to prioritize loan payments, but sometimes I'm surprised by other expenses I didn't anticipate.",
      "Being new to budgeting and having entry-level income are my main challenges.",
      "My income is stable but low since I just started my first professional job.",
      "I do feel some stress about finances, mostly because everything is new to me.",
      "No major challenges yet, but I'm still learning to manage all my new expenses.",
      "I have about $500 saved for emergencies, which probably isn't enough.",
      "I'm not sure if my loan terms are good or not - I didn't have much to compare them to.",
      "No financial advisor, but I've been watching some financial education videos online.",
      "I'd probably ask my parents for advice first if I had trouble making payments.",
      "I'm not sure about financial risks yet - I'm still learning what that means for me.",
      "I'm making the standard payments on time, but haven't thought about paying extra yet.",
      "I check my bank account balance pretty often, but don't really have a system.",
      "About 25% of my income goes to my student loan and a small car loan.",
      "My plan is just to make the scheduled payments until it's paid off."
    ]
  },
  sample10: {
    name: "Entrepreneurial Borrower",
    description: "A small business owner with fluctuating income",
    responses: [
      "My confidence varies with my business cycles, but overall I'm moderately confident.",
      "I've occasionally had to delay payments during slow business periods.",
      "I feel anxious during slow months but confident during busy seasons.",
      "I prioritize loan payments highly, but sometimes business expenses must come first to keep operations running.",
      "Income fluctuation is my primary challenge - some months are excellent while others are tight.",
      "My income is inherently unstable as a small business owner, with significant seasonal variations.",
      "I experience periodic financial stress that correlates with business cycles.",
      "The pandemic significantly impacted my business, though we've been recovering steadily.",
      "I maintain a business emergency fund separate from personal finances, currently at about 2 months of expenses.",
      "My loan terms don't accommodate the seasonal nature of my business as well as I'd like.",
      "I work with both a business accountant and a personal financial advisor quarterly.",
      "I'm proactive about contacting lenders during anticipated slow periods to discuss options.",
      "I have a higher risk tolerance for business investments than for personal finances.",
      "I make larger loan payments during profitable months to compensate for leaner periods.",
      "I review business finances weekly and personal finances bi-weekly.",
      "My debt-to-income ratio varies significantly throughout the year, averaging around 35%.",
      "I have a flexible repayment strategy that accelerates during profitable periods and maintains minimums during slower times."
    ]
  }
};

const SampleDataSelector = ({ onSelectSample, onSubmitSample }) => {
  const [selectedSample, setSelectedSample] = useState(null);
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
      <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M10 4a1 1 0 100 2 1 1 0 000-2zm0 7a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Sample Data
      </h3>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">Select a sample from the dataset or enter your own values below:</p>
        <button
          onClick={onSubmitSample}
          disabled={!selectedSample}
          className={`px-4 py-2 rounded-lg transition shadow-md ${
            selectedSample
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!selectedSample ? "Select a sample first" : "Submit the selected sample data"}
        >
          Submit Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {Object.keys(sampleProfiles).slice(0, 4).map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedSample(key);
              onSelectSample(sampleProfiles[key].responses);
            }}
            className={`w-full py-2 px-4 border rounded-md transition ${
              selectedSample === key
                ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            }`}
            title={sampleProfiles[key].description}
          >
            {sampleProfiles[key].name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {Object.keys(sampleProfiles).slice(4, 8).map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedSample(key);
              onSelectSample(sampleProfiles[key].responses);
            }}
            className={`w-full py-2 px-4 border rounded-md transition ${
              selectedSample === key
                ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            }`}
            title={sampleProfiles[key].description}
          >
            {sampleProfiles[key].name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.keys(sampleProfiles).slice(8, 10).map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedSample(key);
              onSelectSample(sampleProfiles[key].responses);
            }}
            className={`w-full py-2 px-4 border rounded-md transition ${
              selectedSample === key
                ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            }`}
            title={sampleProfiles[key].description}
          >
            {sampleProfiles[key].name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SampleDataSelector;
