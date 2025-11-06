import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  const classes = clsx(
    'card',
    {
      'transition-shadow duration-200 hover:shadow-medium': hover,
    },
    className
  )

  return <div className={classes}>{children}</div>
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  const classes = clsx('card-header', className)
  return <div className={classes}>{children}</div>
}

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  const classes = clsx('card-body', className)
  return <div className={classes}>{children}</div>
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  const classes = clsx('card-footer', className)
  return <div className={classes}>{children}</div>
}

export { Card, CardHeader, CardBody, CardFooter }