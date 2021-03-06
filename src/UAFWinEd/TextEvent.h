/******************************************************************************
* Filename: TextEvent.h
* Copyright (c) 2000, UAF Development Team (email CocoaSpud@hotmail.com)
*
* This program is free software; you can redistribute it and/or
* modify it under the terms of the GNU General Public License
* as published by the Free Software Foundation; either version 2
* of the License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
******************************************************************************/
/////////////////////////////////////////////////////////////////////////////
// CTextEvent dialog

class CTextEvent : public CDialog
{
// Construction
public:
	CTextEvent(TEXT_EVENT_DATA &event, CWnd* pParent = NULL);   // standard constructor
  void GetData(TEXT_EVENT_DATA &event);

// Dialog Data
	//{{AFX_DATA(CTextEvent)
	enum { IDD = IDD_TEXT_EVENT };
	CComboBox	m_Distance;
	CButton	m_Sound;
	CButton	m_ChooseArt;
	CString	m_Text;
	BOOL	m_ForceBackup;
	BOOL	m_HighlightText;
	BOOL	m_WaitForReturn;
	BOOL	m_KillSound;
	//}}AFX_DATA


// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CTextEvent)
	protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
  TEXT_EVENT_DATA m_event;

	// Generated message map functions
	//{{AFX_MSG(CTextEvent)
	afx_msg void OnChoosetexteventart();
	virtual void OnOK();
	virtual BOOL OnInitDialog();
	afx_msg void OnSoundselect();
	afx_msg void OnSelchangeDistance();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};
