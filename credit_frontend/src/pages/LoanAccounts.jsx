import { useEffect, useState } from "react";
import { fetchLoanAccounts } from "../api/loanApi";
import { useNavigate, Link } from "react-router-dom";

const LoanAccounts = () => {
    const [loans, setLoans] = useState([]);
    const [filteredLoans, setFilteredLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLender, setSelectedLender] = useState("All");
    const [sortOption, setSortOption] = useState("due-latest"); // Default sorting by latest due date

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }

        const getLoans = async () => {
            if (token) {
                const data = await fetchLoanAccounts(token);
                setLoans(data);
                setFilteredLoans(data);
            }
            setLoading(false);
        };
        getLoans();
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
        }).format(amount);
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
        let filtered = lender === "All" ? loans : loans.filter((loan) => loan.lender_name === lender);

        filtered.sort((a, b) => {
            if (sortBy === "due-latest") {
                return new Date(b.end_date) - new Date(a.end_date);
            } else if (sortBy === "due-earliest") {
                return new Date(a.end_date) - new Date(b.end_date);
            } else if (sortBy === "balance-highest") {
                return b.balance - a.balance;
            } else if (sortBy === "balance-lowest") {
                return a.balance - b.balance;
            }
            return 0;
        });

        setFilteredLoans([...filtered]);
    };

    const uniqueLenders = [...new Set(loans.map((loan) => loan.lender_name))];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 🔹 Navigation Bar */}
            <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
                <h1 
                    className="text-xl font-bold text-white drop-shadow-lg cursor-pointer" 
                    onClick={() => navigate("/dashboard")}
                >
                    Credit Portal
                </h1>
                <div className="space-x-6">
                    <Link to="/loan-accounts" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Loan Accounts</Link>
                    <Link to="/credit-report" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Credit Report</Link>
                    <Link to="/learn-more" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Learn More</Link>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition drop-shadow-lg">
                        Logout
                    </button>
                </div>
            </nav>

            {/* 🔹 Main Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-left text-gray-800">Loan Accounts</h2>

                {/* 🔹 Filters Section */}
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

                    {/* 🔹 Sort Dropdown */}
                    <label className="text-gray-700 font-medium">
                        Sort By:
                        <select
                            value={sortOption}
                            onChange={handleSortChange}
                            className="ml-3 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="due-latest">Due-Date (Latest to Earliest)</option>
                            <option value="due-earliest">Due-Date (Earliest to Latest)</option>
                            <option value="balance-highest">Bal. (High to Low)</option>
                            <option value="balance-lowest">Bal. (Low to High)</option>
                        </select>
                    </label>
                </div>

                {/* 🔹 Loan Table */}
                {loading ? (
                    <p className="text-left text-gray-500">Loading loan accounts...</p>
                ) : filteredLoans.length === 0 ? (
                    <p className="text-left text-gray-500">No loan accounts found.</p>
                ) : (
                    <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200 bg-white transform transition-all duration-300 hover:scale-[1.01]">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-800 text-sm uppercase tracking-wider shadow-inner">
                                <tr>
                                    <th className="px-6 py-4 text-left border-r">Account Number</th>
                                    <th className="px-6 py-4 text-left border-r">Lender</th>
                                    <th className="px-6 py-4 text-left border-r">Loan Amount</th>
                                    <th className="px-6 py-4 text-left border-r">Balance</th>
                                    <th className="px-6 py-4 text-left border-r">Interest Rate</th>
                                    <th className="px-6 py-4 text-left">End Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {filteredLoans.map((loan, idx) => (
                                    <tr
                                        key={loan.id || idx}
                                        className="hover:bg-gray-50 border-t border-gray-200 transition duration-200"
                                    >
                                        <td className="px-6 py-4 border-r">{loan.account_number}</td>
                                        <td className="px-6 py-4 border-r">{loan.lender_name}</td>
                                        <td className="px-6 py-4 border-r">{formatCurrency(loan.loan_amount)}</td>
                                        <td className="px-6 py-4 border-r">{formatCurrency(loan.balance)}</td>
                                        <td className="px-6 py-4 border-r">{loan.interest_rate}%</td>
                                        <td className="px-6 py-4">{formatDate(loan.end_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanAccounts;