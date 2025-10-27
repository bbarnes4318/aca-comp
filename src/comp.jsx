import React, { useState, useMemo } from 'react';
import { Info, Settings, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

// Calculation utilities
const calcDaily = (option, appsPerDay, dailyHours) => {
  if (option === 'Hourly+Commission') {
    const hourly = 12 * Math.max(dailyHours, 0);
    const commission = 15 * Math.max(appsPerDay - 5, 0); // $15 per app over 5 apps
    return { hourly, commission, total: hourly + commission };
  } else {
    const total = 15 * Math.max(appsPerDay, 0);
    return { hourly: 0, commission: total, total };
  }
};

const calcOEP = (dailyTotal, appsPerDay, workingDays = 53) => {
  const totalApps = appsPerDay * workingDays;
  const oepTotal = dailyTotal * workingDays;
  return { totalApps, oepTotal };
};

const calcResidual = (totalApps, persistencyRate = 100) => {
  const baseMonthly = totalApps * 2;
  const monthly = baseMonthly * (persistencyRate / 100);
  return { monthly };
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Tooltip = ({ children }) => (
  <div className="group relative inline-block ml-1">
    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
    <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-28">
      {children}
    </div>
  </div>
);

export default function ACACalculator() {
  const [compOption, setCompOption] = useState('Hourly+Commission');
  const [dailyHours, setDailyHours] = useState(8);
  const [appsPerDay, setAppsPerDay] = useState(20);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [workingDays, setWorkingDays] = useState(53);
  const [persistencyRate] = useState(70); // Fixed at 70%
  const [residualMonths, setResidualMonths] = useState(12);
  const [compareMode, setCompareMode] = useState(false);

  const calculations = useMemo(() => {
    const calc = (option, hours) => {
      const daily = calcDaily(option, appsPerDay, hours);
      const oep = calcOEP(daily.total, appsPerDay, workingDays);
      
      // Calculate 5-year residuals with 70% retention each year
      const baseMonthlyResidual = oep.totalApps * 2;
      let activeCustomers = oep.totalApps;
      
      const yearlyResiduals = Array.from({ length: 5 }, (_, yearIndex) => {
        // Apply retention at the start of each year (except year 1)
        if (yearIndex > 0) {
          activeCustomers = activeCustomers * (persistencyRate / 100);
        }
        
        const monthlyAmount = activeCustomers * 2;
        const yearTotal = monthlyAmount * 12;
        
        return {
          year: yearIndex + 1,
          activeCustomers: Math.round(activeCustomers),
          monthlyAmount,
          yearTotal,
          retentionRate: yearIndex === 0 ? 100 : persistencyRate
        };
      });
      
      const totalResiduals = yearlyResiduals.reduce((sum, y) => sum + y.yearTotal, 0);
      
      return {
        daily,
        oep,
        yearlyResiduals,
        totalResiduals,
        cumulative: oep.oepTotal + totalResiduals
      };
    };

    return {
      option1: calc('Hourly+Commission', dailyHours),
      option2: calc('CommissionOnly', dailyHours)
    };
  }, [appsPerDay, dailyHours, workingDays, persistencyRate]);

  const currentCalc = compOption === 'Hourly+Commission' ? calculations.option1 : calculations.option2;

  const ResultCard = ({ icon: Icon, label, value, sublabel }) => (
    <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
      <div className="flex items-center mb-1">
        <Icon className="w-4 h-4 text-perenroll-green mr-1" />
        <h3 className="text-xs font-medium text-gray-600">{label}</h3>
      </div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      {sublabel && <div className="text-xs text-gray-500 mt-1">{sublabel}</div>}
    </div>
  );

  const ComparisonCard = ({ calc, title }) => (
    <div className="flex-1 bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-600">Daily Pay</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(calc.daily.total)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total OEP Pay</div>
          <div className="text-2xl font-bold text-perenroll-green">{formatCurrency(calc.oep.oepTotal)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Year 1 Monthly Residual</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(calc.yearlyResiduals[0].monthlyAmount)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">5-Year Residuals</div>
          <div className="text-xl font-semibold text-gray-700">{formatCurrency(calc.totalResiduals)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 p-2">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-3">
          <div className="flex justify-center mb-2">
            <img 
              src="/perenroll.png" 
              alt="PerEnroll Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">ACA Agent Earnings Calculator</h1>
          <p className="text-xs text-gray-600">Open Enrollment Period: November 1, 2025 – January 15, 2026</p>
        </header>

        {/* Compensation Option Toggle */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Compensation Model</h2>
            <label className="flex items-center cursor-pointer">
              <span className="text-sm text-gray-600 mr-2">Compare Both</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                />
                <div className={`w-10 h-6 rounded-full transition ${compareMode ? 'bg-perenroll-green' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition transform ${compareMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          {!compareMode && (
            <div className="flex gap-4">
              <button
                onClick={() => setCompOption('Hourly+Commission')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  compOption === 'Hourly+Commission'
                    ? 'bg-perenroll-green text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-lg">Hourly + Commission</div>
                <div className="text-xs opacity-90 mt-1">$12/hr + $15/app (6+)</div>
              </button>
              <button
                onClick={() => setCompOption('CommissionOnly')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  compOption === 'CommissionOnly'
                    ? 'bg-perenroll-green text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-lg">Commission Only</div>
                <div className="text-xs opacity-90 mt-1">$15 per approved app</div>
              </button>
            </div>
          )}
          
          {compOption === 'Hourly+Commission' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-perenroll-green flex items-start">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Commission starts at the 6th approved application each day. Apps 1-5 earn hourly pay only.</span>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-3 border-2 border-perenroll-green">
          <h2 className="text-sm font-bold text-perenroll-green mb-2">⚠️ ENTER YOUR DAILY ACTIVITY ⚠️</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {compOption === 'Hourly+Commission' && (
            <div>
              <label className="block text-xs font-bold text-red-700 mb-1">
                ⚠️ HOURS WORKED PER DAY ⚠️
              </label>
              <input
                type="range"
                min="0"
                max="16"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>0 hrs</span>
                <span className="font-semibold text-perenroll-green">{dailyHours} hours</span>
                <span>16 hrs</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-red-700 mb-1">
              ⚠️ APPS PER DAY ⚠️
              <Tooltip>Number of approved applications you expect to complete each working day during OEP.</Tooltip>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAppsPerDay(Math.max(0, appsPerDay - 1))}
                className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-sm"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="100"
                value={appsPerDay}
                onChange={(e) => setAppsPerDay(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 text-center text-lg font-bold border border-gray-300 rounded py-1"
              />
              <button
                onClick={() => setAppsPerDay(appsPerDay + 1)}
                className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 font-bold text-sm"
              >
                +
              </button>
            </div>
            {appsPerDay > 20 && (
              <div className="mt-2 text-sm text-amber-600">High volume detected - ensure this is realistic for your workflow.</div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="mt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-perenroll-green hover:text-perenroll-green-dark"
            >
              <Settings className="w-4 h-4 mr-1" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OEP Working Days
                    <Tooltip>Total working days in the Open Enrollment Period (default: 53 weekdays excluding holidays).</Tooltip>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={workingDays}
                    onChange={(e) => setWorkingDays(parseInt(e.target.value) || 53)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persistency Rate (%)
                    <Tooltip>Percentage of customers expected to maintain their policies each month (affects residual calculations).</Tooltip>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={persistencyRate}
                    onChange={(e) => setPersistencyRate(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center text-sm font-semibold text-gray-700 mt-1">{persistencyRate}%</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Residual Months to Preview
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={residualMonths}
                    onChange={(e) => setResidualMonths(parseInt(e.target.value) || 12)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>
          </div>
          </div>

        {/* Results */}
        {!compareMode ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <ResultCard
                icon={DollarSign}
                label="Daily Pay"
                value={formatCurrency(currentCalc.daily.total)}
                sublabel={compOption === 'Hourly+Commission' ? 
                  `Hourly: ${formatCurrency(currentCalc.daily.hourly)} | Commission: ${formatCurrency(currentCalc.daily.commission)}` : 
                  'Pure commission'}
              />
              <ResultCard
                icon={Calendar}
                label="Total OEP Pay"
                value={formatCurrency(currentCalc.oep.oepTotal)}
                sublabel={`${workingDays} working days`}
              />
              <ResultCard
                icon={Users}
                label="Total Approved Apps"
                value={currentCalc.oep.totalApps.toLocaleString()}
                sublabel="During OEP"
              />
              <ResultCard
                icon={TrendingUp}
                label="Year 1 Monthly Residual"
                value={formatCurrency(currentCalc.yearlyResiduals[0].monthlyAmount)}
                sublabel="Starting February 2026"
              />
            </div>

            {/* Residual Summary */}
            <div className="bg-white rounded-lg shadow-md p-2 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">5-Year Residuals (70% retention)</h3>
                  <p className="text-xs text-gray-600">$2/month per customer</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(currentCalc.totalResiduals)}</div>
                  <div className="text-xs text-gray-500">Year 1: {formatCurrency(currentCalc.yearlyResiduals[0].monthlyAmount)}/month</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-perenroll-green to-perenroll-green-dark rounded-lg shadow-lg p-3 text-white">
              <h3 className="text-sm font-semibold mb-2">Total Earnings Projection</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs opacity-90">OEP Earnings</div>
                  <div className="text-lg font-bold">{formatCurrency(currentCalc.oep.oepTotal)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-90">Residuals (60 months)</div>
                  <div className="text-lg font-bold">{formatCurrency(currentCalc.cumulative - currentCalc.oep.oepTotal)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-90">Total Projected</div>
                  <div className="text-lg font-bold">{formatCurrency(currentCalc.cumulative)}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-6 mb-6">
              <ComparisonCard calc={calculations.option1} title="Hourly + Commission" />
              <ComparisonCard calc={calculations.option2} title="Commission Only" />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Side-by-Side Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Metric</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Hourly + Commission</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Commission Only</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="p-3 text-gray-700">Daily Pay</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option1.daily.total)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option2.daily.total)}</td>
                      <td className={`p-3 text-right font-semibold ${calculations.option1.daily.total > calculations.option2.daily.total ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(calculations.option1.daily.total - calculations.option2.daily.total))}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">Total OEP Pay</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option1.oep.oepTotal)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option2.oep.oepTotal)}</td>
                      <td className={`p-3 text-right font-semibold ${calculations.option1.oep.oepTotal > calculations.option2.oep.oepTotal ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(calculations.option1.oep.oepTotal - calculations.option2.oep.oepTotal))}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">Monthly Residual</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option1.yearlyResiduals[0].monthlyAmount)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(calculations.option2.yearlyResiduals[0].monthlyAmount)}</td>
                      <td className="p-3 text-right font-semibold text-gray-600">Same</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Footer Notes */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Assumes {workingDays} OEP working days (Nov 1, 2025 – Jan 15, 2026).</p>
          <p>Residuals of $2/month per app start in February 2026 and continue while policies remain active.</p>
        </div>
      </div>
    </div>
  );
}