# Security Policy

## Supported Versions

Currently supported versions of PolarisAI:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. Please follow these steps to report security issues:

### 🔒 **Private Reporting (Recommended)**

1. **GitHub Security Advisories** (preferred):
   - Go to the [Security tab](https://github.com/jakubkunert/PolarisAI/security) in the repository
   - Click "Report a vulnerability"
   - Fill out the security advisory form

2. **Email**: If GitHub Security Advisories are not available:
   - Send an email to: `security@polarisai.dev` (or maintainer email)
   - Include "SECURITY" in the subject line
   - Provide detailed information about the vulnerability

### 📋 **What to Include**

Please provide as much information as possible:

- **Vulnerability Type**: Authentication bypass, injection, XSS, etc.
- **Affected Component**: Which part of PolarisAI is affected
- **Steps to Reproduce**: Clear instructions to reproduce the issue
- **Impact Assessment**: What can an attacker achieve
- **Suggested Fix**: If you have ideas for fixing the issue
- **Environment**: OS, browser, Node.js version, etc.

### 🕒 **Response Timeline**

- **Initial Response**: Within 48 hours
- **Triage**: Within 1 week
- **Fix Development**: Depends on severity (1-30 days)
- **Public Disclosure**: After fix is released

### 🏆 **Recognition**

We appreciate security researchers who help improve PolarisAI:

- **Security Hall of Fame**: Recognition in our security acknowledgments
- **Early Notification**: Advance notice of security updates
- **Collaboration**: Work with our team on fixing the issue

### 🔐 **Security Best Practices**

When using PolarisAI:

#### For Self-Hosted Deployments:
- **Environment Variables**: Never expose API keys in client-side code
- **HTTPS Only**: Always use HTTPS in production
- **Update Regularly**: Keep dependencies and PolarisAI updated
- **Access Control**: Implement proper authentication and authorization
- **Network Security**: Use firewalls and proper network segmentation

#### For Developers:
- **Code Reviews**: All code changes require review
- **Dependency Scanning**: Regular security scans of dependencies
- **Static Analysis**: Use tools like CodeQL for vulnerability detection
- **Input Validation**: Always validate and sanitize user input
- **Secure Defaults**: Default configurations should be secure

### 🚨 **Known Security Considerations**

- **API Keys**: Store securely, never commit to version control
- **Model Providers**: Each provider has its own security implications
- **User Data**: Handle conversation data according to privacy laws
- **Rate Limiting**: Implement proper rate limiting to prevent abuse

### 📞 **Contact Information**

- **Primary Contact**: Jakub Kunert (@jakubkunert)
- **Security Email**: `security@polarisai.dev` (if available)
- **GitHub**: Create a private security advisory

---

Thank you for helping keep PolarisAI secure! 🔐
