import { useEffect, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Modal, Alert, Spinner, Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { FiDollarSign, FiCreditCard, FiTrendingUp, FiAlertCircle, FiInfo, FiPlusCircle, FiRefreshCw, FiUser } from 'react-icons/fi';
import Header from "../components/Header";
import { getLoanAccounts, createLoanAccount, deleteLoanAccount, synchronizeLoanData } from "../services/loanService";
import { calculateCreditScore, getUserFinancialProfile, updateFinancialProfile } from "../services/financialService";
import { synchronizeData, userData$ } from "../services/dataService";
import ErrorBoundary from "../components/ErrorBoundary";
import LoanAccountsFallback from "../components/LoanAccountsFallback";
import ErrorDetails from "../components/ErrorDetails";

const LoanAccountsContent = () => {
    const [loans, setLoans] = useState([]);
    const [filteredLoans, setFilteredLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLender, setSelectedLender] = useState("All");
    const [sortOption, setSortOption] = useState("due-latest");
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [showAddLoanModal, setShowAddLoanModal] = useState(false);
    const [newLoan, setNewLoan] = useState({
        loan_type: 'personal',
        lender: '',
        principal_amount: '',
        interest_rate: '12.5', // Default interest rate
        term_months: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_payment: '',
        remaining_balance: '',
    });
    const [error, setError] = useState('');
    const [lastError, setLastError] = useState(null); // Store the full error object
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Credit score and financial profile data
    const [creditScore, setCreditScore] = useState(null);
    const [financialProfile, setFinancialProfile] = useState(null);
    const [loadingFinancialData, setLoadingFinancialData] = useState(true);
    const [totalLoanBalance, setTotalLoanBalance] = useState(0);
    const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);
    const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0);
    const [userName, setUserName] = useState('');

    const navigate = useNavigate();

    // Subscribe to user data
    useEffect(() => {
        const userDataSubscription = userData$.subscribe(userData => {
            if (userData) {
                if (userData.name) {
                    setUserName(userData.name);
                } else if (userData.email) {
                    // Use email as fallback
                    setUserName(userData.email.split('@')[0]);
                }
            }
        });

        return () => {
            userDataSubscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        // Fetch all required data
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setLoadingFinancialData(true);

                // Fetch financial profile first
                const profileData = await getUserFinancialProfile();
                setFinancialProfile(profileData);

                // Fetch loans
                await fetchLoans();

                // Calculate credit score
                const scoreData = await calculateCreditScore(profileData);
                setCreditScore(scoreData);

                // Ensure consistency between financial profile and loan accounts
                validateDataConsistency(profileData);

                setLoadingFinancialData(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLastError(error); // Store the full error object

                // Use the enhanced error message from the axios interceptor if available
                if (error.userMessage) {
                    setError(error.userMessage);
                } else if (error.response && error.response.data) {
                    // Try to extract a meaningful error message from the response
                    const errorMessage = error.response.data.error || error.response.data.detail || JSON.stringify(error.response.data);
                    setError(`Error loading data: ${errorMessage}`);
                } else {
                    setError("Failed to load all financial data. Please try again.");
                }

                setLoading(false);
                setLoadingFinancialData(false);
            }
        };

        fetchAllData();

        // Check dark mode
        setDarkMode(localStorage.getItem('darkMode') === 'true');
    }, [navigate]);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const data = await getLoanAccounts();
            setLoans(data);
            setFilteredLoans(data);

            // Calculate total loan balance and monthly payment
            if (data && data.length > 0) {
                const totalBalance = data.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
                const totalPayment = data.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

                setTotalLoanBalance(totalBalance);
                setTotalMonthlyPayment(totalPayment);

                // Calculate debt-to-income ratio if financial profile is available
                if (financialProfile && financialProfile.income) {
                    const ratio = totalPayment / parseFloat(financialProfile.income);
                    setDebtToIncomeRatio(ratio);
                }
            } else {
                setTotalLoanBalance(0);
                setTotalMonthlyPayment(0);
                setDebtToIncomeRatio(0);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching loans:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format number with commas
    const formatNumberWithCommas = (number) => {
        if (!number) return "0";
        // Remove any existing commas and non-numeric characters except decimal point
        const cleanNumber = number.toString().replace(/,/g, '').replace(/[^\d.]/g, '');
        return new Intl.NumberFormat("en-KE").format(parseFloat(cleanNumber));
    };

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-KE", options);
    };

    const handleLenderChange = (e) => {
        const lender = e.target.value;
        setSelectedLender(lender);
        filterAndSortLoans(lender, sortOption);
    };

    const handleSortChange = (e) => {
        const option = e.target.value;
        setSortOption(option);
        filterAndSortLoans(selectedLender, option);
    };

    const filterAndSortLoans = (lender, sortBy) => {
        let filtered = lender === "All" ? loans : loans.filter((loan) => loan.lender === lender);

        filtered.sort((a, b) => {
            if (sortBy === "due-latest") {
                return new Date(b.end_date) - new Date(a.end_date);
            } else if (sortBy === "due-earliest") {
                return new Date(a.end_date) - new Date(b.end_date);
            } else if (sortBy === "balance-highest") {
                return b.remaining_balance - a.remaining_balance;
            } else if (sortBy === "balance-lowest") {
                return a.remaining_balance - b.remaining_balance;
            }
            return 0;
        });

        setFilteredLoans([...filtered]);
    };

    const handleNewLoanChange = (e) => {
        const { name, value } = e.target;

        // Handle numeric inputs with commas
        if (name === 'principal_amount' || name === 'monthly_payment' || name === 'remaining_balance') {
            // Remove commas and other non-numeric characters except decimal point
            const numericValue = value.replace(/,/g, '').replace(/[^\d.]/g, '');

            setNewLoan(prev => ({
                ...prev,
                [name]: numericValue
            }));

            // Auto-calculate remaining balance if principal amount is entered
            if (name === 'principal_amount') {
                setNewLoan(prev => ({
                    ...prev,
                    [name]: numericValue,
                    remaining_balance: numericValue
                }));
            }
        } else {
            // For non-numeric fields
            setNewLoan(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Auto-calculate end date if start date and term are entered
        if ((name === 'start_date' || name === 'term_months') && newLoan.start_date && newLoan.term_months) {
            const startDate = new Date(newLoan.start_date);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + parseInt(newLoan.term_months));
            setNewLoan(prev => ({
                ...prev,
                end_date: endDate.toISOString().split('T')[0]
            }));
        }
    };

    const handleAddLoan = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate form
        if (!newLoan.lender || !newLoan.principal_amount || !newLoan.interest_rate ||
            !newLoan.term_months || !newLoan.start_date || !newLoan.monthly_payment) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);

            // Convert string values to numbers
            const loanData = {
                ...newLoan,
                principal_amount: parseFloat(newLoan.principal_amount),
                interest_rate: parseFloat(newLoan.interest_rate),
                term_months: parseInt(newLoan.term_months),
                monthly_payment: parseFloat(newLoan.monthly_payment),
                remaining_balance: parseFloat(newLoan.remaining_balance || newLoan.principal_amount),
                is_active: true
            };

            const response = await createLoanAccount(loanData);
            setSuccess('Loan added successfully!');
            setShowAddLoanModal(false);

            // Reset form
            setNewLoan({
                loan_type: 'personal',
                lender: '',
                principal_amount: '',
                interest_rate: '',
                term_months: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                monthly_payment: '',
                remaining_balance: '',
            });

            // Refresh loans
            await fetchLoans();

            // Recalculate credit score with updated loan data
            try {
                // Fetch updated financial profile
                const profileData = await getUserFinancialProfile();

                // Calculate new total loan amount including the newly added loan
                const updatedLoans = await fetchLoans();
                const newTotalLoanAmount = updatedLoans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
                const newTotalMonthlyPayment = updatedLoans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

                // Update financial profile with new loan totals if there's a significant difference
                if (Math.abs(newTotalLoanAmount - parseFloat(profileData.loan_amount || 0)) > 100 ||
                    Math.abs(newTotalMonthlyPayment - parseFloat(profileData.monthly_payment || 0)) > 100) {

                    // Update the profile with the new totals
                    const updatedProfileData = {
                        ...profileData,
                        loan_amount: newTotalLoanAmount,
                        monthly_payment: newTotalMonthlyPayment
                    };

                    // If we have income, update debt-to-income ratio
                    if (profileData.income) {
                        const income = parseFloat(profileData.income);
                        if (income > 0) {
                            updatedProfileData.debt_to_income = Math.min(newTotalMonthlyPayment / income, 1.0);
                        }
                    }

                    // Update the financial profile
                    await updateFinancialProfile(updatedProfileData);

                    // Refresh the profile data
                    const refreshedProfileData = await getUserFinancialProfile();
                    setFinancialProfile(refreshedProfileData);

                    // Calculate updated credit score with the refreshed profile
                    const scoreData = await calculateCreditScore(refreshedProfileData);
                    setCreditScore(scoreData);
                } else {
                    // Just update the local state
                    setFinancialProfile(profileData);

                    // Calculate updated credit score
                    const scoreData = await calculateCreditScore(profileData);
                    setCreditScore(scoreData);
                }

                // Update totals in the UI
                setTotalLoanBalance(newTotalLoanAmount);
                setTotalMonthlyPayment(newTotalMonthlyPayment);

                // Show additional success message about credit score impact
                setSuccess(
                    'Loan added successfully! Your credit score has been updated to reflect this new loan. ' +
                    'Adding loans may temporarily lower your score, but making regular payments will improve it over time.'
                );
            } catch (error) {
                console.error("Error updating credit score after loan addition:", error);
            }
        } catch (error) {
            console.error('Error adding loan:', error);

            // Store the full error object for detailed display
            setLastError(error);

            // Set a user-friendly error message
            if (error.response && error.response.data) {
                if (error.response.data.error) {
                    setError(`Failed to add loan: ${error.response.data.error}`);
                } else if (error.response.data.detail) {
                    setError(`Failed to add loan: ${error.response.data.detail}`);
                } else if (typeof error.response.data === 'object') {
                    // Format validation errors
                    const errorDetails = Object.entries(error.response.data)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('; ');
                    setError(`Validation error: ${errorDetails}`);
                } else {
                    setError(`Failed to add loan: ${error.response.statusText}`);
                }
            } else if (error.message) {
                setError(`Failed to add loan: ${error.message}`);
            } else {
                setError('Failed to add loan. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLoan = async (loanId) => {
        if (window.confirm('Are you sure you want to delete this loan?')) {
            try {
                await deleteLoanAccount(loanId);
                setSuccess('Loan deleted successfully!');

                // Refresh loans
                await fetchLoans();

                // Recalculate credit score with updated loan data
                try {
                    // Fetch updated financial profile
                    const profileData = await getUserFinancialProfile();

                    // Calculate new total loan amount after loan deletion
                    const updatedLoans = await fetchLoans();
                    const newTotalLoanAmount = updatedLoans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
                    const newTotalMonthlyPayment = updatedLoans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

                    // Update financial profile with new loan totals if there's a significant difference
                    if (Math.abs(newTotalLoanAmount - parseFloat(profileData.loan_amount || 0)) > 100 ||
                        Math.abs(newTotalMonthlyPayment - parseFloat(profileData.monthly_payment || 0)) > 100) {

                        // Update the profile with the new totals
                        const updatedProfileData = {
                            ...profileData,
                            loan_amount: newTotalLoanAmount,
                            monthly_payment: newTotalMonthlyPayment
                        };

                        // If we have income, update debt-to-income ratio
                        if (profileData.income) {
                            const income = parseFloat(profileData.income);
                            if (income > 0) {
                                updatedProfileData.debt_to_income = Math.min(newTotalMonthlyPayment / income, 1.0);
                            }
                        }

                        // Update the financial profile
                        await updateFinancialProfile(updatedProfileData);

                        // Refresh the profile data
                        const refreshedProfileData = await getUserFinancialProfile();
                        setFinancialProfile(refreshedProfileData);

                        // Calculate updated credit score with the refreshed profile
                        const scoreData = await calculateCreditScore(refreshedProfileData);
                        setCreditScore(scoreData);
                    } else {
                        // Just update the local state
                        setFinancialProfile(profileData);

                        // Calculate updated credit score
                        const scoreData = await calculateCreditScore(profileData);
                        setCreditScore(scoreData);
                    }

                    // Update totals in the UI
                    setTotalLoanBalance(newTotalLoanAmount);
                    setTotalMonthlyPayment(newTotalMonthlyPayment);

                    // Show additional success message about credit score impact
                    setSuccess(
                        'Loan deleted successfully! Your credit score has been updated to reflect this change. ' +
                        'Removing loans may improve your credit utilization ratio and debt-to-income ratio.'
                    );
                } catch (error) {
                    console.error("Error updating credit score after loan deletion:", error);
                }
            } catch (error) {
                console.error('Error deleting loan:', error);
                setError('Failed to delete loan. Please try again.');
            }
        }
    };

    const uniqueLenders = [...new Set(loans.map((loan) => loan.lender))];

    // Helper functions for recommendations
    const getDebtToIncomeRatioStatus = () => {
        if (debtToIncomeRatio <= 0.3) return { status: 'Healthy', color: 'success' };
        if (debtToIncomeRatio <= 0.4) return { status: 'Moderate', color: 'warning' };
        return { status: 'High', color: 'danger' };
    };

    const getRecommendation = () => {
        if (!financialProfile || !creditScore) return '';

        const dtiStatus = getDebtToIncomeRatioStatus();
        let recommendation = '';

        if (dtiStatus.status === 'High') {
            recommendation = "Your debt-to-income ratio is high. Consider focusing on paying down high-interest loans first and avoid taking on new debt.";
        } else if (dtiStatus.status === 'Moderate') {
            recommendation = "Your debt-to-income ratio is moderate. Consider consolidating high-interest loans or increasing payments on existing loans to reduce debt faster.";
        } else {
            recommendation = "Your debt-to-income ratio is healthy. Continue making regular payments and consider saving or investing any extra funds.";
        }

        // Add loan repayment recommendation if loans exist
        if (loans && loans.length > 0) {
            // Find the highest interest rate loan
            const highestInterestLoan = [...loans].sort((a, b) => parseFloat(b.interest_rate) - parseFloat(a.interest_rate))[0];

            // Calculate recommended payment (20% more than minimum if DTI is high, 10% more if moderate)
            let recommendedPayment = parseFloat(highestInterestLoan.monthly_payment);
            if (dtiStatus.status === 'High') {
                recommendedPayment *= 1.2;
            } else if (dtiStatus.status === 'Moderate') {
                recommendedPayment *= 1.1;
            }

            recommendation += `\n\nRecommended Action: Focus on your ${highestInterestLoan.loan_type} loan from ${highestInterestLoan.lender} with ${highestInterestLoan.interest_rate}% interest rate. `;

            if (dtiStatus.status !== 'Healthy') {
                recommendation += `Consider increasing your monthly payment from ${formatCurrency(highestInterestLoan.monthly_payment)} to ${formatCurrency(recommendedPayment)} to pay it off faster and save on interest.`;
            }
        }

        return recommendation;
    };

    const getCreditScoreColor = () => {
        if (!creditScore) return 'secondary';

        const score = creditScore.score;
        if (score >= 740) return 'success';
        if (score >= 670) return 'info';
        if (score >= 580) return 'warning';
        return 'danger';
    };

    // Function to validate data consistency between financial profile and loan accounts
    const validateDataConsistency = (profileData) => {
        if (!profileData || !loans || loans.length === 0) return;

        // Calculate total loan amount and monthly payment from loans
        const loansTotalAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
        const loansTotalMonthlyPayment = loans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

        // Check if there's a significant discrepancy between profile and loans data
        const profileLoanAmount = parseFloat(profileData.loan_amount || 0);
        const profileMonthlyPayment = parseFloat(profileData.monthly_payment || 0);

        const loanAmountDiscrepancy = Math.abs(loansTotalAmount - profileLoanAmount);
        const monthlyPaymentDiscrepancy = Math.abs(loansTotalMonthlyPayment - profileMonthlyPayment);

        // If there's a significant discrepancy, show a warning
        if (loanAmountDiscrepancy > 100 || monthlyPaymentDiscrepancy > 100) {
            console.warn('Data inconsistency detected between financial profile and loan accounts');
            console.warn(`Profile loan amount: ${profileLoanAmount}, Loans total: ${loansTotalAmount}`);
            console.warn(`Profile monthly payment: ${profileMonthlyPayment}, Loans total: ${loansTotalMonthlyPayment}`);

            setError(
                "There appears to be a discrepancy between your financial profile and loan accounts data. " +
                "This may affect your credit score calculation. Please use the 'Sync Data' button to update your profile."
            );
        }
    };

    // Function to synchronize financial profile with loan accounts data
    const syncFinancialProfile = async () => {
        try {
            // Reset state
            setError("");
            setSuccess("");
            setLoading(true);

            console.log("Starting data synchronization...");

            // Set a timeout to show a message if it's taking too long
            const timeoutId = setTimeout(() => {
                console.log("Sync is taking longer than expected...");
                setError("Synchronization is taking longer than expected. Please wait...");
            }, 5000); // 5 seconds

            // Check server availability first
            const { checkServerAvailability } = await import('../services/axiosConfig');
            const serverAvailable = await checkServerAvailability();

            if (!serverAvailable) {
                clearTimeout(timeoutId);
                throw new Error("Server is currently unavailable. Please check your connection and try again later.");
            }

            // Use the centralized synchronization function
            const result = await synchronizeData();

            // Clear the timeout since we got a response
            clearTimeout(timeoutId);

            console.log("Sync completed, processing results:", result);

            // Check if we have valid results
            if (!result) {
                throw new Error("No data returned from synchronization");
            }

            // Update state with synchronized data
            if (result.profile) {
                console.log("Setting financial profile:", result.profile);
                setFinancialProfile(result.profile);
            } else {
                console.warn("No profile data returned from synchronization");
            }

            if (result.loans) {
                console.log(`Setting ${result.loans.length} loans`);
                setLoans(result.loans);
                setFilteredLoans(result.loans);
            } else {
                console.warn("No loans data returned from synchronization");
            }

            if (result.creditScore) {
                console.log("Setting credit score:", result.creditScore);
                setCreditScore(result.creditScore);
            } else {
                console.warn("No credit score returned from synchronization");
            }

            // Calculate totals from the updated loans
            if (result.loans && result.loans.length > 0) {
                const totalBalance = result.loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
                const totalPayment = result.loans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

                console.log(`Setting total loan balance: ${totalBalance}, monthly payment: ${totalPayment}`);
                setTotalLoanBalance(totalBalance);
                setTotalMonthlyPayment(totalPayment);

                // Calculate debt-to-income ratio if financial profile is available
                if (result.profile && result.profile.income) {
                    const income = parseFloat(result.profile.income);
                    if (income > 0) {
                        const ratio = totalPayment / income;
                        console.log(`Setting debt-to-income ratio: ${ratio}`);
                        setDebtToIncomeRatio(ratio);
                    }
                }
            } else {
                // Reset totals if no loans
                setTotalLoanBalance(0);
                setTotalMonthlyPayment(0);
                setDebtToIncomeRatio(0);
            }

            setSuccess("All data successfully synchronized across modules!");
            setLoading(false);
        } catch (error) {
            console.error("Error synchronizing data:", error);

            // Clear the timeout if it's still active
            clearTimeout(timeoutId);

            // Determine the appropriate error message
            let errorMessage;

            // Use the enhanced error message from the axios interceptor if available
            if (error.userMessage) {
                errorMessage = error.userMessage;
            }
            // Check for specific error codes
            else if (error.code === 'NO_FINANCIAL_DATA') {
                errorMessage = "Please enter your financial information in the Dashboard first, then sync your data.";
            } else if (error.code === 'NO_LOAN_DATA') {
                errorMessage = "No loan accounts found. Please add a loan account first, then sync your data.";
            }
            // Check for network errors
            else if (error.message && error.message.includes('Network Error')) {
                errorMessage = "Network error. Please check your connection and try again.";
            }
            // Check for server errors
            else if (error.response && error.response.status >= 500) {
                errorMessage = "Server error. Our team has been notified and is working on it.";
            }
            // Fallback to checking the state directly if no specific error code
            else if (!financialProfile || Object.keys(financialProfile || {}).length === 0 ||
                !financialProfile.income || !financialProfile.employment_years) {
                errorMessage = "Please enter your financial information in the Dashboard first, then sync your data.";
            } else if (!loans || loans.length === 0) {
                errorMessage = "No loan accounts found. Please add a loan account first, then sync your data.";
            } else if (error.message) {
                // Use the error message if available
                errorMessage = `Synchronization error: ${error.message}`;
            } else {
                // Default error message
                errorMessage = "Failed to synchronize data. Please try again.";
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'dark-mode' : 'bg-gray-100'}`}>
            {/* Header with Navigation */}
            <Header />

            {/* Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-3xl font-bold text-gray-800">Loan Accounts</h2>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={syncFinancialProfile}
                            className="px-3 py-2 d-flex align-items-center"
                            disabled={loading}
                        >
                            <FiRefreshCw className={`me-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setShowAddLoanModal(true)}
                            className="px-4 py-2 d-flex align-items-center"
                        >
                            <FiPlusCircle className="me-2" /> Add New Loan
                        </Button>
                    </div>
                </div>

                {error && (
                    <ErrorDetails
                        error={lastError}
                        message={error}
                        genericMessage="An error occurred while processing your loan information. Please try again."
                        variant="danger"
                        dismissible
                        onDismiss={() => setError('')}
                        showDetails={false}
                        showExactError={false}
                    />
                )}
                {success && <Alert variant="success" className="mb-4" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                {/* Financial Summary Section */}
                <Row className="mb-4">
                    <Col lg={8}>
                        <Card className="shadow-sm border-0 h-100 loan-card">
                            <Card.Header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0 d-flex align-items-center">
                                        <FiDollarSign className="me-2" /> Financial Summary
                                    </h4>
                                    {userName && (
                                        <div className="d-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded">
                                            <FiUser className="me-2 text-white" />
                                            <span className="text-white">
                                                {userName}'s Loans
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {loadingFinancialData ? (
                                    <div className="text-center py-3">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Loading financial data...
                                    </div>
                                ) : (
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <h5 className="text-primary mb-2">Credit Score</h5>
                                                {creditScore ? (
                                                    <div className="d-flex align-items-center">
                                                        <div className={`badge bg-${getCreditScoreColor()} p-2 me-2`} style={{ fontSize: '1.2rem' }}>
                                                            {creditScore.score}
                                                        </div>
                                                        <span className="text-muted">{creditScore.category}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Not available</span>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <h5 className="text-primary mb-2">Total Loan Balance</h5>
                                                <div className="d-flex align-items-center">
                                                    <span className="fs-4 fw-bold me-2">{formatCurrency(totalLoanBalance)}</span>
                                                </div>
                                                <small className="text-muted d-block">
                                                    Monthly Payment: {formatCurrency(totalMonthlyPayment)}
                                                </small>
                                                {financialProfile && financialProfile.loan_amount &&
                                                 Math.abs(totalLoanBalance - parseFloat(financialProfile.loan_amount)) > 100 && (
                                                    <>
                                                        <small className="text-warning d-block mt-1">
                                                            <FiAlertCircle className="me-1" />
                                                            Profile shows {formatCurrency(financialProfile.loan_amount)}
                                                        </small>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="mt-2"
                                                            onClick={syncFinancialProfile}
                                                        >
                                                            Sync Data
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <div className="p-3 bg-light rounded-3 h-100">
                                                <h5 className="text-primary mb-2">Debt-to-Income Ratio</h5>
                                                <div className="mb-2">
                                                    <span className={`badge bg-${getDebtToIncomeRatioStatus().color} me-2`}>
                                                        {(debtToIncomeRatio * 100).toFixed(1)}%
                                                    </span>
                                                    <span className="text-muted">{getDebtToIncomeRatioStatus().status}</span>
                                                </div>
                                                <ProgressBar
                                                    variant={getDebtToIncomeRatioStatus().color}
                                                    now={Math.min(debtToIncomeRatio * 100, 100)}
                                                    style={{ height: '8px' }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="shadow-sm border-0 h-100 loan-card">
                            <Card.Header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                                <h4 className="mb-0 d-flex align-items-center">
                                    <FiInfo className="me-2" /> Recommendation
                                </h4>
                            </Card.Header>
                            <Card.Body>
                                {loadingFinancialData ? (
                                    <div className="text-center py-3">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Loading recommendations...
                                    </div>
                                ) : (
                                    <div className="d-flex h-100 align-items-center">
                                        <div>
                                            <div className="mb-3">
                                                <p className="mb-2">
                                                    <FiAlertCircle className={`text-${getDebtToIncomeRatioStatus().color} me-2`} />
                                                    {getRecommendation().split('\n\n')[0]}
                                                </p>
                                                {getRecommendation().includes('\n\n') && (
                                                    <div className="mt-3 p-3 bg-light rounded">
                                                        <h6 className="fw-bold">
                                                            <FiDollarSign className="me-1" />
                                                            {getRecommendation().split('\n\n')[1].split(':')[0]}:
                                                        </h6>
                                                        <p className="mb-0">
                                                            {getRecommendation().split('\n\n')[1].split(':')[1]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {loans.length > 0 && (
                                                <p className="mb-0 small text-muted">
                                                    Based on your {loans.length} loan account{loans.length !== 1 ? 's' : ''} and financial profile.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters Section */}
                <div className="mb-4 flex flex-wrap gap-4">
                    <label className="text-gray-700 font-medium">
                        Filter by Lender:
                        <select
                            value={selectedLender}
                            onChange={handleLenderChange}
                            className="ml-3 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="All">All</option>
                            {uniqueLenders.map((lender, idx) => (
                                <option key={idx} value={lender}>
                                    {lender}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Sort Dropdown */}
                    <label className="text-gray-700 font-medium">
                        Sort By:
                        <select
                            value={sortOption}
                            onChange={handleSortChange}
                            className="ml-3 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="due-latest">Due-Date (Latest to Earliest)</option>
                            <option value="due-earliest">Due-Date (Earliest to Latest)</option>
                            <option value="balance-highest">Balance (High to Low)</option>
                            <option value="balance-lowest">Balance (Low to High)</option>
                        </select>
                    </label>
                </div>

                {/* Loan Table */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p className="mt-2">Loading loan accounts...</p>
                    </div>
                ) : filteredLoans.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-lg shadow-sm p-4">
                        <p className="text-gray-500 mb-3">No loan accounts found.</p>
                        <div className="mb-3">
                            <p className="text-muted small">
                                <FiInfo className="me-1" />
                                To get started, add your first loan account. This will help calculate your credit score and provide personalized recommendations.
                            </p>
                            {!financialProfile || Object.keys(financialProfile || {}).length === 0 ||
                             !financialProfile.income || !financialProfile.employment_years ? (
                                <div className="alert alert-info mt-3 text-start">
                                    <FiAlertCircle className="me-2" />
                                    <strong>Tip:</strong> Make sure to enter your financial information in the Dashboard first for accurate credit score calculations.
                                </div>
                            ) : null}
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowAddLoanModal(true)}
                        >
                            Add Your First Loan
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 bg-white">
                        {financialProfile && financialProfile.loan_amount &&
                         Math.abs(totalLoanBalance - parseFloat(financialProfile.loan_amount)) > 1000 && (
                            <div className="bg-light p-2 border-bottom text-center">
                                <small className="text-muted">
                                    <FiInfo className="me-1" />
                                    Your financial profile indicates a total loan amount of {formatCurrency(financialProfile.loan_amount)},
                                    while your loan accounts total {formatCurrency(totalLoanBalance)}.
                                </small>
                            </div>
                        )}
                        <table className="min-w-full table-auto">
                            <thead className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-800 text-sm uppercase tracking-wider shadow-inner">
                                <tr>
                                    <th className="px-4 py-3 text-left border-r">Lender</th>
                                    <th className="px-4 py-3 text-left border-r">Type</th>
                                    <th className="px-4 py-3 text-left border-r">Amount</th>
                                    <th className="px-4 py-3 text-left border-r">Balance</th>
                                    <th className="px-4 py-3 text-left border-r">Interest</th>
                                    <th className="px-4 py-3 text-left border-r">Monthly</th>
                                    <th className="px-4 py-3 text-left border-r">End Date</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {filteredLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        className="hover:bg-gray-50 border-t border-gray-200 transition duration-200"
                                    >
                                        <td className="px-4 py-3 border-r font-medium">{loan.lender}</td>
                                        <td className="px-4 py-3 border-r capitalize">{loan.loan_type}</td>
                                        <td className="px-4 py-3 border-r">{formatCurrency(loan.principal_amount)}</td>
                                        <td className="px-4 py-3 border-r">{formatCurrency(loan.remaining_balance)}</td>
                                        <td className="px-4 py-3 border-r">{loan.interest_rate}%</td>
                                        <td className="px-4 py-3 border-r">{formatCurrency(loan.monthly_payment)}</td>
                                        <td className="px-4 py-3 border-r">{formatDate(loan.end_date)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteLoan(loan.id)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Loan Modal */}
            <Modal show={showAddLoanModal} onHide={() => setShowAddLoanModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                    <Modal.Title className="d-flex align-items-center">
                        <FiCreditCard className="me-2" /> Add New Loan
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="mb-3">
                        <div className="d-flex">
                            <FiInfo size={20} className="me-2 flex-shrink-0 mt-1" />
                            <div>
                                <strong>Adding a loan will update your credit score.</strong> The loan details will be saved to your profile and will affect your debt-to-income ratio and other credit factors.
                                {financialProfile && financialProfile.loan_amount && (
                                    <div className="mt-2 small">
                                        <span className="text-primary">
                                            <FiDollarSign className="me-1" />
                                            Your financial profile indicates a total loan amount of {formatCurrency(financialProfile.loan_amount)}.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Alert>

                    <Form onSubmit={handleAddLoan}>
                        <Card className="mb-4 border-0 shadow-sm loan-card">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">Loan Details</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Loan Type</Form.Label>
                                            <Form.Select
                                                name="loan_type"
                                                value={newLoan.loan_type}
                                                onChange={handleNewLoanChange}
                                                required
                                                className="form-select-lg"
                                            >
                                                <option value="personal">Personal Loan</option>
                                                <option value="mortgage">Mortgage</option>
                                                <option value="auto">Auto Loan</option>
                                                <option value="student">Student Loan</option>
                                                <option value="credit_card">Credit Card</option>
                                                <option value="other">Other</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Lender Name</Form.Label>
                                            <Form.Select
                                                name="lender"
                                                value={newLoan.lender}
                                                onChange={handleNewLoanChange}
                                                required
                                                className="form-select-lg"
                                            >
                                                <option value="">Select a lender or type below</option>
                                                <optgroup label="Banks">
                                                    <option value="KCB Bank">KCB Bank</option>
                                                    <option value="Equity Bank">Equity Bank</option>
                                                    <option value="Co-operative Bank">Co-operative Bank</option>
                                                    <option value="NCBA Bank">NCBA Bank</option>
                                                    <option value="Standard Chartered">Standard Chartered</option>
                                                    <option value="Absa Bank">Absa Bank</option>
                                                    <option value="DTB Bank">DTB Bank</option>
                                                    <option value="Stanbic Bank">Stanbic Bank</option>
                                                </optgroup>
                                                <optgroup label="Microfinance">
                                                    <option value="Faulu Microfinance">Faulu Microfinance</option>
                                                    <option value="Kenya Women Microfinance">Kenya Women Microfinance</option>
                                                    <option value="Rafiki Microfinance">Rafiki Microfinance</option>
                                                </optgroup>
                                                <optgroup label="SACCOs">
                                                    <option value="Mwalimu SACCO">Mwalimu SACCO</option>
                                                    <option value="Stima SACCO">Stima SACCO</option>
                                                    <option value="Unaitas SACCO">Unaitas SACCO</option>
                                                </optgroup>
                                                <optgroup label="Digital Lenders">
                                                    <option value="Tala">Tala</option>
                                                    <option value="Branch">Branch</option>
                                                    <option value="M-Shwari">M-Shwari</option>
                                                    <option value="KCB M-Pesa">KCB M-Pesa</option>
                                                </optgroup>
                                                <option value="other">Other (Type Below)</option>
                                            </Form.Select>
                                            {newLoan.lender === 'other' && (
                                                <Form.Control
                                                    type="text"
                                                    name="custom_lender"
                                                    value={newLoan.custom_lender || ''}
                                                    onChange={(e) => setNewLoan({
                                                        ...newLoan,
                                                        lender: e.target.value,
                                                        custom_lender: e.target.value
                                                    })}
                                                    placeholder="Enter lender name"
                                                    className="form-control-lg mt-2"
                                                    required
                                                />
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Principal Amount (KES)</Form.Label>
                                            <div className="input-group input-group-lg">
                                                <span className="input-group-text">KES</span>
                                                <Form.Control
                                                    type="text"
                                                    name="principal_amount"
                                                    value={newLoan.principal_amount ? formatNumberWithCommas(newLoan.principal_amount) : ''}
                                                    onChange={handleNewLoanChange}
                                                    placeholder="e.g., 500,000"
                                                    required
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <div className="d-flex flex-wrap gap-2">
                                                    {[100000, 250000, 500000, 1000000].map(amount => (
                                                        <Button
                                                            key={amount}
                                                            variant={Number(newLoan.principal_amount) === amount ? "primary" : "outline-secondary"}
                                                            size="sm"
                                                            onClick={() => setNewLoan({
                                                                ...newLoan,
                                                                principal_amount: amount.toString(),
                                                                remaining_balance: amount.toString()
                                                            })}
                                                        >
                                                            {formatCurrency(amount)}
                                                        </Button>
                                                    ))}

                                                    {/* Suggested amount based on financial profile */}
                                                    {financialProfile && financialProfile.loan_amount &&
                                                     loans && loans.length > 0 &&
                                                     Math.abs(totalLoanBalance - parseFloat(financialProfile.loan_amount)) > 1000 && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                const suggestedAmount = Math.max(0, parseFloat(financialProfile.loan_amount) - totalLoanBalance);
                                                                setNewLoan({
                                                                    ...newLoan,
                                                                    principal_amount: suggestedAmount.toString(),
                                                                    remaining_balance: suggestedAmount.toString()
                                                                });
                                                            }}
                                                        >
                                                            <FiInfo className="me-1" />
                                                            Suggested: {formatCurrency(Math.max(0, parseFloat(financialProfile.loan_amount) - totalLoanBalance))}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Interest Rate (%)</Form.Label>
                                            <div className="input-group input-group-lg">
                                                <Form.Control
                                                    type="number"
                                                    name="interest_rate"
                                                    value={newLoan.interest_rate}
                                                    onChange={handleNewLoanChange}
                                                    placeholder="e.g., 12.5"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                                <span className="input-group-text">%</span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="d-flex flex-wrap gap-2">
                                                    {[7.5, 10, 12.5, 15].map(rate => (
                                                        <Button
                                                            key={rate}
                                                            variant={Number(newLoan.interest_rate) === rate ? "primary" : "outline-secondary"}
                                                            size="sm"
                                                            onClick={() => setNewLoan({
                                                                ...newLoan,
                                                                interest_rate: rate.toString()
                                                            })}
                                                        >
                                                            {rate}%
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="mb-4 border-0 shadow-sm loan-card">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">Payment Details</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Term (months)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="term_months"
                                                value={newLoan.term_months}
                                                onChange={handleNewLoanChange}
                                                placeholder="e.g., 36"
                                                min="1"
                                                required
                                                className="form-control-lg"
                                            />
                                            <div className="mt-2">
                                                <div className="d-flex flex-wrap gap-2">
                                                    {[12, 24, 36, 60, 120, 240].map(term => (
                                                        <Button
                                                            key={term}
                                                            variant={Number(newLoan.term_months) === term ? "primary" : "outline-secondary"}
                                                            size="sm"
                                                            onClick={() => {
                                                                // Update term and recalculate end date
                                                                const startDate = new Date(newLoan.start_date);
                                                                const endDate = new Date(startDate);
                                                                endDate.setMonth(startDate.getMonth() + term);

                                                                setNewLoan({
                                                                    ...newLoan,
                                                                    term_months: term.toString(),
                                                                    end_date: endDate.toISOString().split('T')[0]
                                                                });
                                                            }}
                                                        >
                                                            {term} {term === 12 ? "months" : term < 24 ? "month" : "months"}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Monthly Payment (KES)</Form.Label>
                                            <div className="input-group input-group-lg">
                                                <span className="input-group-text">KES</span>
                                                <Form.Control
                                                    type="text"
                                                    name="monthly_payment"
                                                    value={newLoan.monthly_payment ? formatNumberWithCommas(newLoan.monthly_payment) : ''}
                                                    onChange={handleNewLoanChange}
                                                    placeholder="e.g., 15,000"
                                                    required
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <div className="d-flex flex-wrap gap-2">
                                                    {[5000, 10000, 15000, 25000].map(payment => (
                                                        <Button
                                                            key={payment}
                                                            variant={Number(newLoan.monthly_payment) === payment ? "primary" : "outline-secondary"}
                                                            size="sm"
                                                            onClick={() => setNewLoan({
                                                                ...newLoan,
                                                                monthly_payment: payment.toString()
                                                            })}
                                                        >
                                                            {formatCurrency(payment)}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Start Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="start_date"
                                                value={newLoan.start_date}
                                                onChange={handleNewLoanChange}
                                                required
                                                className="form-control-lg"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>End Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="end_date"
                                                value={newLoan.end_date}
                                                onChange={handleNewLoanChange}
                                                required
                                                readOnly={newLoan.term_months && newLoan.start_date}
                                                className="form-control-lg"
                                            />
                                            <Form.Text className="text-muted">
                                                Auto-calculated based on term and start date
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowAddLoanModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddLoan}
                        disabled={submitting}
                        size="lg"
                        className="px-4"
                    >
                        {submitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Loan'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

// Wrapper component with error boundary
const LoanAccounts = () => {
    const [hasError, setHasError] = useState(false);

    const handleRetry = () => {
        setHasError(false);
        window.location.reload();
    };

    return (
        <ErrorBoundary>
            <Suspense fallback={<div className="p-5 text-center"><Spinner animation="border" /></div>}>
                {hasError ? (
                    <LoanAccountsFallback onRetry={handleRetry} />
                ) : (
                    <LoanAccountsContent />
                )}
            </Suspense>
        </ErrorBoundary>
    );
};

export default LoanAccounts;